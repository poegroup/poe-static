module.exports = function(locals, pathName) {
  var currentPath = (locals || {})[pathName || 'path'];
  if (currentPath === '') currentPath = '/';
  return function linkTo(path, checkParent) {
    return {
      href: path,
      'class': {
        'is-active': checkParent ? !!~currentPath.indexOf(path) : currentPath === path
      }
    };
  };
};
