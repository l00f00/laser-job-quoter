import type { Material } from '@shared/types';
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
export interface PricePackage {
  name: 'Economy' | 'Standard' | 'Express';
  leadTime: string;
  machineTimeMultiplier: number;
  total: number;
  breakdown: Record<string, number>;
}
// --- Pricing Constants (tweakable) ---
const SETUP_FEE = 5.00; // Flat fee per job
const MINIMUM_JOB_COST = 10.00; // Minimum price for any job
const CUT_COST_PER_MM = 0.02; // Cost per mm of laser cutting
const ENGRAVE_COST_PER_SQ_MM = 0.005; // Cost per sq mm of engraving
const COMPLEXITY_SURCHARGE_FACTOR = 0.001; // Added cost per path node
export function calculateEstimate(
  metrics: ArtworkMetrics,
  options: JobOptions
): PricePackage[] {
  const { material, thicknessMm, jobType } = options;
  const { widthMm, heightMm, cutLengthMm, engraveAreaSqMm, pathComplexity } = metrics;
  // 1. Material Cost
  const materialAreaSqMm = widthMm * heightMm;
  const materialCost = materialAreaSqMm * material.costPerSqMm * (thicknessMm / 3); // Assume cost scales with thickness
  // 2. Cut Cost
  const cutCost = jobType === 'cut' || jobType === 'both' ? cutLengthMm * CUT_COST_PER_MM : 0;
  // 3. Engrave Cost
  const engraveCost = jobType === 'engrave' || jobType === 'both' ? engraveAreaSqMm * ENGRAVE_COST_PER_SQ_MM : 0;
  // 4. Complexity Surcharge
  const complexitySurcharge = pathComplexity * COMPLEXITY_SURCHARGE_FACTOR;
  // 5. Base Cost
  const baseCost = SETUP_FEE + materialCost + cutCost + engraveCost + complexitySurcharge;
  const finalBaseCost = Math.max(baseCost, MINIMUM_JOB_COST);
  const packages: PricePackage[] = [
    {
      name: 'Economy',
      leadTime: '5-7 days',
      machineTimeMultiplier: 1.0,
      breakdown: {},
      total: 0,
    },
    {
      name: 'Standard',
      leadTime: '3-4 days',
      machineTimeMultiplier: 1.5,
      breakdown: {},
      total: 0,
    },
    {
      name: 'Express',
      leadTime: '1-2 days',
      machineTimeMultiplier: 2.5,
      breakdown: {},
      total: 0,
    },
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
/**
 * Parses an SVG string and extracts key metrics for quoting.
 * NOTE: This is a simplified parser. A production version would need to handle more SVG features.
 */
export function getSvgMetrics(svgString: string, physicalWidthMm: number): Promise<ArtworkMetrics> {
  return new Promise((resolve, reject) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const svg = doc.documentElement;
      if (!svg || svg.tagName.toLowerCase() !== 'svg') {
        throw new Error('Invalid SVG file');
      }
      // Temporarily append to DOM to use browser APIs
      svg.style.position = 'absolute';
      svg.style.visibility = 'hidden';
      document.body.appendChild(svg);
      const bbox = svg.getBBox();
      const viewBox = svg.viewBox.baseVal;
      const svgWidth = viewBox && viewBox.width > 0 ? viewBox.width : bbox.width;
      const svgHeight = viewBox && viewBox.height > 0 ? viewBox.height : bbox.height;
      if (svgWidth === 0) {
        document.body.removeChild(svg);
        throw new Error('Could not determine SVG dimensions.');
      }
      const scale = physicalWidthMm / svgWidth;
      const physicalHeightMm = svgHeight * scale;
      let totalLength = 0;
      let engraveArea = 0;
      let complexity = 0;
      svg.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse').forEach(el => {
        complexity++;
        if (el instanceof SVGGeometryElement) {
          const fill = window.getComputedStyle(el).fill;
          const stroke = window.getComputedStyle(el).stroke;
          // Simple logic: if it has a stroke, it's a cut. If it has a fill, it's an engrave.
          if (stroke && stroke !== 'none') {
            totalLength += el.getTotalLength();
          }
          if (fill && fill !== 'none') {
             const pathBbox = el.getBBox();
             engraveArea += pathBbox.width * pathBbox.height;
          }
        }
      });
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