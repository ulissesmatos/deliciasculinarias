export default function route(pageContext) {
  const { urlPathname } = pageContext;
  if (urlPathname === '/admin' || urlPathname.startsWith('/admin/')) {
    return { routeParams: {} };
  }
  return false;
}
