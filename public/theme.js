(function() {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light' || (!t && window.matchMedia('(prefers-color-scheme: light)').matches)) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {
    document.documentElement.classList.add('dark');
  }
})();
