from pathlib import Path
import re

path = Path(__file__).resolve().parent.parent / 'src' / 'App.tsx'
text = path.read_text(encoding='utf-8')
text = text.replace('fallback={<LoadingFallback />}', 'fallback={null}')
text = text.replace('const LoadingFallback = () => (\n  <div className="flex h-96 items-center justify-center">\n    <div className="h-8 w-8 animate-spin rounded-full border-4 border-bark/20 border-t-bark" />\n  </div>\n);\n\n', '')
text = text.replace('      <AnimatePresence mode="wait" initial={false}>\n        <Routes location={location}>', '      <AnimatePresence mode="wait" initial={false}>\n        <Suspense fallback={null}>\n          <Routes location={location}>')
text = text.replace('</Routes>\n      </AnimatePresence>', '</Routes>\n        </Suspense>\n      </AnimatePresence>')
path.write_text(text, encoding='utf-8')
print('updated', path)
