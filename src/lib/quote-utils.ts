import type { Material, PricePackage } from '@shared/types';
import { toast } from 'sonner';
export interface ArtworkMetrics {
  widthMm: number;
  heightMm: number;
  cutLengthMm: number;
  engraveAreaSqMm: number;
  pathComplexity: number; // e.g., number of nodes
  aspectRatio: number;
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
      const svg = doc.querySelector('svg') as SVGSVGElement | null;
      if (!svg) {
        throw new Error('No SVG element found in document');
      }
      if (doc.querySelector('parsererror')) {
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
        aspectRatio: svgWidth / svgHeight,
      });
    } catch (error) {
      reject(error);
    }
  });
}
export function processSvgForCut(svgString: string, strokeColor: string = 'black'): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error("SVG parsing error:", parserError.textContent);
      throw new Error('Invalid SVG content');
    }
    const root = doc.documentElement;
    if (root && root.tagName && root.tagName.toLowerCase() === 'svg' && !root.getAttribute('xmlns')) {
      root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    const elements = doc.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, line');
    elements.forEach(el => {
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', strokeColor);
      el.setAttribute('stroke-width', '0.5');
    });
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc.documentElement);
  } catch (error) {
    console.error("Failed to process SVG for cut preview:", error);
    return svgString;
  }
}
export function createMaskedTextureSvg(svgString: string, textureUrl: string, width: number, height: number, redLines: boolean, maskingMode: boolean): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    if (doc.querySelector('parsererror')) throw new Error('Invalid SVG');
    const root = doc.querySelector('svg') as SVGSVGElement | null;
    if (!root) throw new Error('No SVG element found');
    if (!root.getAttribute('xmlns')) root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!root.getAttribute('xmlns:xlink')) root.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    const clipPath = doc.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.id = 'cutMask';
    const elements = doc.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, line');
    if (maskingMode) {
      elements.forEach(el => {
        const clone = el.cloneNode(true) as SVGElement;
        clone.removeAttribute('stroke');
        clone.removeAttribute('stroke-width');
        clone.removeAttribute('fill');
        clipPath.appendChild(clone);
      });
    } else {
      const bbox = root.getBBox();
      const clipRect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
      clipRect.setAttribute('x', String(bbox.x));
      clipRect.setAttribute('y', String(bbox.y));
      clipRect.setAttribute('width', String(bbox.width));
      clipRect.setAttribute('height', String(bbox.height));
      clipPath.appendChild(clipRect);
    }
    const defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.appendChild(clipPath);
    root.insertBefore(defs, root.firstChild);
    const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('clip-path', 'url(#cutMask)');
    const image = doc.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttribute('xlink:href', textureUrl);
    image.setAttribute('width', String(width));
    image.setAttribute('height', String(height));
    image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    g.appendChild(image);
    while (root.lastChild && root.lastChild !== defs) {
      root.removeChild(root.lastChild);
    }
    root.appendChild(g);
    if (redLines) {
      const overlayG = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      overlayG.setAttribute('opacity', '0.8');
      elements.forEach(el => {
        const clone = el.cloneNode(true) as SVGElement;
        clone.setAttribute('fill', 'none');
        clone.setAttribute('stroke', 'red');
        clone.setAttribute('stroke-width', '0.5');
        overlayG.appendChild(clone);
      });
      root.appendChild(overlayG);
    }
    return new XMLSerializer().serializeToString(root);
  } catch (e) {
    console.error("Failed to create masked texture SVG:", e);
    return processSvgForCut(svgString, redLines ? 'red' : 'black'); // Fallback
  }
}
export function canvasFallbackForRaster(fileContent: string, physicalWidth: number, physicalHeight: number, textureUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject('Could not get canvas context');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = physicalWidth * dpr * 4; // Higher res for better quality
    canvas.height = physicalHeight * dpr * 4;
    ctx.scale(dpr * 4, dpr * 4);
    const artworkImg = new Image();
    artworkImg.crossOrigin = "anonymous";
    artworkImg.onload = () => {
      const textureImg = new Image();
      textureImg.crossOrigin = "anonymous";
      textureImg.onload = () => {
        ctx.drawImage(textureImg, 0, 0, physicalWidth, physicalHeight);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(artworkImg, 0, 0, physicalWidth, physicalHeight);
        resolve(canvas.toDataURL('image/png'));
      };
      textureImg.onerror = () => reject('Failed to load texture image.');
      textureImg.src = textureUrl;
    };
    artworkImg.onerror = () => reject('Failed to load artwork image.');
    artworkImg.src = fileContent;
  });
}