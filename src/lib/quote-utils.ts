import type { Material, PricePackage } from '@shared/types';
import { toast } from 'sonner';
export interface ArtworkMetrics {
  widthMm: number;
  heightMm: number;
  cutLengthMm: number;
  engraveAreaSqMm: number;
  pathComplexity: number; // e.g., number of nodes
}
export interface JobOptions {
  material: Material;
  thicknessMm: number;
  jobType: 'cut' | 'engrave' | 'both';
}
// --- Pricing Constants (tweakable) ---
const SETUP_FEE = 5.00; // Flat fee per job
const MINIMUM_JOB_COST = 10.00; // Minimum price for any job
const CUT_COST_PER_MM = 0.02; // Cost per mm of laser cutting
const ENGRAVE_COST_PER_SQ_MM = 0.005; // Cost per sq mm of engraving
const COMPLEXITY_SURCHARGE_FACTOR = 0.001; // Added cost per path node
const COMPLEXITY_CAP = 1000; // Max nodes before using bbox fallback
export function checkManufacturability(
  metrics: ArtworkMetrics,
  material: Material,
  _thicknessMm: number
): string[] {
  const issues: string[] = [];
  if (material.minFeatureMm > 0 && (metrics.widthMm < material.minFeatureMm || metrics.heightMm < material.minFeatureMm)) {
    issues.push(`Artwork dimensions are smaller than the material's minimum feature size of ${material.minFeatureMm}mm.`);
  }
  if (metrics.cutLengthMm > 0 && metrics.cutLengthMm < material.minFeatureMm * 2) {
    issues.push(`A cut path is too short (${metrics.cutLengthMm.toFixed(2)}mm) for the material's minimum feature size and kerf.`);
  }
  return issues;
}
export function calculateEstimate(
  metrics: ArtworkMetrics,
  options: JobOptions
): PricePackage[] {
  const { material, thicknessMm, jobType } = options;
  const { widthMm, heightMm, cutLengthMm, engraveAreaSqMm, pathComplexity } = metrics;
  const issues = checkManufacturability(metrics, material, thicknessMm);
  if (issues.length > 0) {
    toast.warning('Manufacturability Warning', {
      description: issues.join(' '),
    });
  }
  const materialAreaSqMm = widthMm * heightMm;
  const materialCost = materialAreaSqMm * material.costPerSqMm * (thicknessMm / 3);
  const cutCost = jobType === 'cut' || jobType === 'both' ? cutLengthMm * CUT_COST_PER_MM : 0;
  const engraveCost = jobType === 'engrave' || jobType === 'both' ? engraveAreaSqMm * ENGRAVE_COST_PER_SQ_MM : 0;
  const complexitySurcharge = pathComplexity * COMPLEXITY_SURCHARGE_FACTOR;
  const baseCost = SETUP_FEE + materialCost + cutCost + engraveCost + complexitySurcharge;
  const finalBaseCost = Math.max(baseCost, MINIMUM_JOB_COST);
  const packages: PricePackage[] = [
    { name: 'Economy', leadTime: '5-7 days', machineTimeMultiplier: 1.0, breakdown: {}, total: 0 },
    { name: 'Standard', leadTime: '3-4 days', machineTimeMultiplier: 1.5, breakdown: {}, total: 0 },
    { name: 'Express', leadTime: '1-2 days', machineTimeMultiplier: 2.5, breakdown: {}, total: 0 },
  ];
  packages.forEach(pkg => {
    const machineTimeCost = (cutCost + engraveCost) * (pkg.machineTimeMultiplier - 1);
    const total = finalBaseCost + machineTimeCost;
    pkg.total = parseFloat(total.toFixed(2));
    pkg.breakdown = {
      'Setup Fee': parseFloat(SETUP_FEE.toFixed(2)),
      'Material Cost': parseFloat(materialCost.toFixed(2)),
      'Cut Cost': parseFloat(cutCost.toFixed(2)),
      'Engrave Cost': parseFloat(engraveCost.toFixed(2)),
      'Complexity Surcharge': parseFloat(complexitySurcharge.toFixed(2)),
      'Speed Surcharge': parseFloat(machineTimeCost.toFixed(2)),
    };
  });
  return packages;
}
export function getSvgMetrics(svgString: string, physicalWidthMm: number): Promise<ArtworkMetrics> {
  return new Promise((resolve, reject) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const svg = doc.documentElement as SVGSVGElement;
      if (!svg || svg.tagName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) {
        throw new Error('Invalid or malformed SVG file');
      }
      svg.style.position = 'absolute';
      svg.style.visibility = 'hidden';
      document.body.appendChild(svg);
      const bbox = svg.getBBox();
      const viewBox = svg.viewBox.baseVal;
      const svgWidth = viewBox && viewBox.width > 0 ? viewBox.width : bbox.width;
      const svgHeight = viewBox && viewBox.height > 0 ? viewBox.height : bbox.height;
      if (svgWidth === 0) {
        document.body.removeChild(svg);
        throw new Error('Could not determine SVG dimensions (width is zero).');
      }
      const scale = physicalWidthMm / svgWidth;
      const physicalHeightMm = svgHeight * scale;
      let totalLength = 0;
      let engraveArea = 0;
      const elements = svg.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse');
      const complexity = elements.length;
      if (complexity > COMPLEXITY_CAP) {
        toast.warning('High Complexity Detected', {
          description: `Artwork has over ${COMPLEXITY_CAP} elements. Using bounding box for cut length estimate.`,
        });
        totalLength = 2 * (bbox.width + bbox.height);
      } else {
        elements.forEach(el => {
          if (el instanceof SVGGeometryElement) {
            const style = window.getComputedStyle(el);
            const fill = style.fill;
            const stroke = style.stroke;
            if (stroke && stroke !== 'none' && style.strokeWidth !== '0') {
              totalLength += el.getTotalLength();
            }
            if (fill && fill !== 'none' && fill !== 'transparent') {
              const pathBbox = el.getBBox();
              engraveArea += pathBbox.width * pathBbox.height;
            }
          }
        });
      }
      document.body.removeChild(svg);
      resolve({
        widthMm: physicalWidthMm,
        heightMm: physicalHeightMm,
        cutLengthMm: totalLength * scale,
        engraveAreaSqMm: engraveArea * scale * scale,
        pathComplexity: complexity,
      });
    } catch (error) {
      reject(error);
    }
  });
}
// Stub for path simplification
export function simplifiedMetrics(svgString: string, sampleRate: number = 10): Promise<ArtworkMetrics> {
  console.log('Path simplification stub called with sample rate:', sampleRate);
  // In a real implementation, this would parse the SVG, reduce path nodes, and recalculate metrics.
  // For now, it just returns the original metrics.
  return getSvgMetrics(svgString, 100); // Assuming a default width for re-calculation
}
// Stub for kerf visualization
export function getKerfAdjustedMetrics(originalMetrics: ArtworkMetrics, kerfMm: number): ArtworkMetrics {
  // This is a visual approximation. Real kerf compensation is a complex geometric operation.
  const perimeter = 2 * (originalMetrics.widthMm + originalMetrics.heightMm);
  return {
    ...originalMetrics,
    cutLengthMm: originalMetrics.cutLengthMm + (perimeter * kerfMm), // Approximate added length
  };
}