import { readFile } from 'node:fs/promises';

/** The project's dependency-free packer supports its deliberately small ESM subset.
 * Modules retain separate scopes. Unrecognised import/export syntax fails the build.
 * This is build-time code only, not a runtime loader or evaluator of user input. */
export async function bundleWorker(entry) {
  const modules = new Map();
  const output = [];
  const pending = new Set();
  async function visit(url) {
    if (pending.has(url.href)) throw new Error('Circular Worker import');
    if (modules.has(url.href)) return modules.get(url.href);
    pending.add(url.href);
    const name = `foodModule${modules.size}`;
    modules.set(url.href, name);
    let source = await readFile(url, 'utf8');
    const importPattern = /^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];[^\S\n]*$/gm;
    const imports = [...source.matchAll(importPattern)];
    for (const match of imports) {
      if (!match[2].startsWith('.')) throw new Error(`External Worker dependency: ${match[2]}`);
      const dependency = await visit(new URL(match[2], url));
      const bindings = match[1].trim();
      if (!/^[\w\s,]+$/.test(bindings) || /\bas\b/.test(bindings)) throw new Error('Unsupported import binding');
      source = source.replace(match[0], `const { ${bindings} } = ${dependency};`);
    }
    const exports = [];
    source = source.replace(/^export\s+((?:async\s+)?function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm, (_, declaration, identifier) => {
      exports.push(identifier);
      return `${declaration} ${identifier}`;
    });
    if (/^export default /m.test(source)) {
      source = source.replace(/^export default /m, 'const defaultExport = ');
      exports.push('default: defaultExport');
    }
    if (/^\s*(?:import|export)\s/m.test(source)) throw new Error(`Unsupported module syntax: ${url.pathname}`);
    output.push(`const ${name} = (() => {\n${source}\nreturn { ${exports.join(', ')} };\n})();`);
    pending.delete(url.href);
    return name;
  }
  const root = await visit(entry);
  return `${output.join('\n\n')}\nexport default ${root}.default;\n`;
}
