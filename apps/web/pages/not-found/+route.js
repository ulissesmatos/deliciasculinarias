// Catch-all route for 404 pages — lowest priority via negative precedence
export default function route(pageContext) {
  return { routeParams: {}, precedence: -10 };
}
