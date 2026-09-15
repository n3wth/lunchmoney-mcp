"""Generate the favicon from the site's Suisse Semibold dollar glyph."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

root = Path(__file__).resolve().parents[1]
font = TTFont(root / 'site/fonts/SuisseIntl-Semibold.otf')
glyphs = font.getGlyphSet()
glyph = glyphs[font.getBestCmap()[ord('$')]]
path = SVGPathPen(glyphs)
glyph.draw(path)
bounds = BoundsPen(glyphs)
glyph.draw(bounds)
x0, y0, x1, y1 = bounds.bounds
scale = 42 / (y1 - y0)
x = 32 - (x0 + x1) * scale / 2
y = 32 + (y0 + y1) * scale / 2
(root / 'site/favicon.svg').write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
    '<title>Lunch Money for Agents</title>'
    '<rect width="64" height="64" rx="14" fill="#176B57"/>'
    f'<path fill="#ffffff" transform="translate({x} {y}) scale({scale} {-scale})" '
    f'd="{path.getCommands()}"/></svg>\n'
)
