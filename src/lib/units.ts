/**
 * US display for pack sizes. Metric sizes get their US customary equivalent appended
 * ("100 g" → "100 g (3.5 oz)", "1 kg" → "1 kg (2.2 lb)", "250 ml" → "250 ml (8.5 fl oz)"),
 * matching the dual declaration US shoppers see on food labels. Anything already in US units,
 * counts ("10 beans") or unrecognised text is returned unchanged.
 */
const G_PER_OZ = 28.3495;
const G_PER_LB = 453.592;
const ML_PER_FL_OZ = 29.5735;

const round = (value: number) => {
  const digits = value >= 10 ? 0 : 1;
  return Number(value.toFixed(digits)).toLocaleString("en-US");
};

export function formatSize(size?: string | null): string {
  if (!size) return "";
  const text = size.trim();
  if (/\b(oz|lb|lbs|fl\.? ?oz|gal|qt|pt)\b|\(/i.test(text)) return text;

  const match = text.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\b(.*)$/i);
  if (!match) return text;

  const amount = Number(match[1].replace(",", "."));
  const unit = match[2].toLowerCase();
  const rest = match[3];

  let us: string;
  if (unit === "g" || unit === "kg") {
    const grams = unit === "kg" ? amount * 1000 : amount;
    us = grams >= G_PER_LB ? `${round(grams / G_PER_LB)} lb` : `${round(grams / G_PER_OZ)} oz`;
  } else {
    const ml = unit === "l" ? amount * 1000 : amount;
    us = `${round(ml / ML_PER_FL_OZ)} fl oz`;
  }

  return `${match[1]} ${match[2]} (${us})${rest}`;
}
