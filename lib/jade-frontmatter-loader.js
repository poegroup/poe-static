var marked = require('marked');
var highlight = require('highlight.js');
var diff = require('diff');

module.exports = function(source) {
  this.cacheable && this.cacheable();

  source = JSON.parse(source);
  var locals = source.locals;
  locals = JSON.stringify(Object.keys(source.locals || {}).map(function(key) {
    return [key, locals[key]];
  }));

  var content = doHighlight(source.__content);

  this.addDependency(source.extends);

  var parts = [
    'extends ' + source.extends,
    'append locals',
    '  - ' + locals + '.forEach(function(kv) { locals[kv[0]] = kv[1]});',
    'block ' + (source.block || 'main'),
    '  != ' + JSON.stringify(content),
  ];

  return parts.join('\n');
};

var renderer = new marked.Renderer();

renderer.heading = function(text, level) {
  var escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');

  return '' +
    '<h' + level + '>' +
      text +
      '<a id="' + escapedText + '" class="Header-anchor" href="#' + escapedText + '" aria-hidden="true">' +
        '<span class="Header-anchor-icon"></span>' +
      '</a>' +
    '</h' + level + '>';
};

function doHighlight(content) {
  var codeId = 0;
  var codeBlocks = {};

  var INCLUDE_RE = /^INCLUDE (\w+):(\d+)(?:-(\d+))?$/;

  var rendered = marked(content || '', {
    renderer: renderer,
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    langPrefix: 'hljs ',
    highlight: function(code, lang) {
      if (!lang) return code;

      var blockName = codeId++;
      var parent;

      lang = lang.replace(/\[([^\]]+)\]/, function(_, n) {
        var nameParts = n.split(/\s*\<\-\s*/);
        blockName = nameParts[0];
        parent = nameParts[1];
        return '';
      });

      codeBlocks[blockName] = code;

      var id = 'code-' + blockName + '-';

      var highlighted = highlight.highlight(lang, code).value;
      if (!parent) return addLineNumbers(highlighted, id);

      var parentBlock = codeBlocks[parent];

      if (!parentBlock) {
        throw new Error('Missing parent code block ' + JSON.stringify(parent) + ' in ' + JSON.stringify(blockName));
      }

      var i = 0;

      var out = diff
        .diffLines(parentBlock, code)
        .map(function(line) {
          var className;

          if (line.added) className = 'hljs-diff-line-added';
          if (line.removed) className = 'hljs-diff-line-removed';
          if (!className) className = 'hljs-diff-line-unchanged';

          var value = highlight.highlight(lang, line.value).value;

          return wrapLines(value, function(v, it, lines) {
            var nl = it === lines.length - 1 ? '' : '\n';
            if (!v) return nl;
            return '<span id=' + (id + (i++)) + ' class=' + className + '>' + v + nl + '</span>';
          }, false);
        })
        .join('');

      return out;
    }
  });

  return rendered;
}

function addLineNumbers(code, id) {
  return wrapLines(code, function(line, i) {
    i = i + 1;
    var lineLink = id + i;
    return '<span id=' + lineLink + '>' + line + '</span>';
  });
}

function wrapLines(code, cb, addNewLine) {
  if (typeof addNewLine === 'undefined') addNewLine = true;
  var lines = code.split('\n');

  return lines
    .map(function(line, i) {
      return cb(line, i, lines);
    })
    .join(addNewLine ? '\n' : '');
}
