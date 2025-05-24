/** @type {import('./$types').PageLoad} */
export function load({ params, fetch }) {
  // The slug parameter comes from the route path
  const slug = params.sportname;
  
  // Construct the path to the JSON file
  const path = `/statics/${slug}.json`;
  
  // Use the provided fetch function, not the global one
  return {
    json: fetch(path).then(r => {
      if (r.ok) return r.json();
      throw new Error(`Could not load ${path}`);
    })
  };
}