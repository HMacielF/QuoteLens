(function () {
  const QL = window.QL, PUBLIC = { home: 1, signin: 1 };
  function route() {
    QL.tok++;
    const p = location.hash.split('/'), name = p[1] || '';
    if (!QL.auth.user() && !PUBLIC[name]) return QL.goTo('home');
    (QL.views[name] || (QL.auth.user() ? QL.views.dashboard : QL.views.home))(p[2], p[3]);
  }
  window.addEventListener('hashchange', route);
  QL.auth.init().then(route).catch(e => QL.render('<main style="padding:40px"><h1>Sign-in problem</h1><p role="alert">' + QL.esc(e.message) + '</p></main>'));
})();
