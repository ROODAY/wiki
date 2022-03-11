Learnings from https://arkwright.github.io/scaling-react-server-side-rendering.html

# Load Balancing
## Random load balancing is bad
It may seem intuitive that over time it would evenly distribute load, but at any individual *moment*, load will be uneven (flip a coin and see, while it's random with 50% chance of either side, at any particular instance the counts of H to T will likely be uneven). E.g. some instances will be getting more requests than others.

## What's a better load balancing strategy?
- Interesting presentation: https://www.infoq.com/presentations/load-balancing/
- Random load balancing with load shedding at each instance, so that the balancer randomly tries another instance, is better than load queueing. Still bad though as this adds latency and as load saturation increases, chance of hitting a free instance decreases.
- Round-robin is better than above as it ensures that *requests* are distributed evenly, but not *load*. One request may take longer to render than another, for example.
- Join-shortest-queue, load balancer will send to instance with shortest queue using some heuristic, e.g. number of requests in queue, or something else that can approximate load
- Note that while random load balancing is bad, it is not bad to have multiple load balancers and randomly select from them, provided each balancer implements a better balancing strategy to the instances that process requests. Load balancers can typically handle all network traffic easily by themselves, having more than one allows failover capability.

# Isomorphic Rendering
- How to scale server-side rendering when spinning up horizontal instances isn't feasible Easy, just don't use server-side rendering! If you use something like Redux, or anything that can make total application state easily serializable (maybe total application state isn't necessary, but let's required application state), you can skip the SSR if servers are under load (just pass the serialized state along, e.g. the data) and just have the user's browser do it. At least that way the response time is faster.
	- To me, this model at first glance seems like it could work with Remix. Remix is about getting the data on the server side and rendering and passing to the user. Well, the data is usually the longest part (network request), so surely we can just pass that along and do client side rendering fallback with Remix as well? Requires further investigation.
		- Although, it seems that in general Isomorphic rendering is to only render the first page and let the client handle the rest, whereas Remix is about always using SSR. Perhaps Remix can get away with this because it is used in infrastructures where horizontal scaling is easy, e.g. Lambdas/Azure Functions/Cloudflare Workers?

Quoting the good part below
## How It Works
Building a client-side rendering fallback system is remarkably straightforward.

The Node server simply maintains a request queue length counter. For every request received, increment the counter, and for every error or response sent, decrement the counter. When the queue length is less than or equal to `n`, perform regular data fetching, Redux store hydration, and a server-side React render. When the queue length is greater than `n`, skip the server-side React rendering part — the browser will handle that, using the data from the Redux store.

![Diagram of how client-side rendering fallback acts as a kind of load throttling. Monolith sends 7 requests to the React service. The first request is server-side rendered, because at that point in time, the service has 0 requests in queue. The next 6 requests are triaged and queued. The first 2 requests are queued for server-side rendering, because we have arbitrarily chosen a queue length of < 3 as our light load cutoff for server-side rendering. The next 3 requests are queued for client-side rendering, because we have arbitrarily chosen a queue length of < 6 as our heavy load cutoff for client-side rendering. The final request exceeds our maximum queue length, and is dropped in order to shed load.](https://arkwright.github.io/images/scaling-react-server-side-rendering/client-side-rendering-fallback-queue.svg)

The exact value of `n` will need to be tuned to match the characteristics of your application. Generally speaking, `n` should be slightly larger than the typical queue length during peak expected load.

Of course, if SEO is a requirement, this approach contains a slight problem: if a search engine crawls the site during a traffic surge, it may not receive a server-side rendered response, and therefore it may not index your pages! Fortunately this is an easy problem to solve: provide an exception for known search engine user agent strings.

# Load Shedding
Instead of load balancer sending requests directly to instances that do the render, forward requests to a cluster, where a master process decides whether its workers have capacity and forwards the request to one of them, or if no capacity, will return a 503 to the load balancer so it can try another cluster, or forward it along to the client so a fallback can occur.

# Component Caching
I.e. render the TSX/JSX template `<Greeting name="Rudy" />` into HTML `<p>Hi, Rudy</p>`. Here's an [example library](https://github.com/electrode-io/electrode-react-ssr-caching). Note that while this does make renders super fast, it has some big cons:
- This library in particular is tied to a specific version of React as it mutates some of its core APIs
- There are a lot of gotchas for deciding when to invalidate the cache/make sure you don't cache everything and run out of memory, etc. *"There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton*

It would seem that component caching should only be used for components that don't change very often/don't vary based on the user, e.g. header, nav, footer, etc.

# Keep dependencies up to date
You can get free performance gains by just updating Node and React versions, so do it.

# Know what to work on first during incremental rewrites
E.g. converting an entire non-React app to React is usually off the table as it's too expensive and will take too long, so incremental change is required. Make sure to pick the right stuff to convert in such a case, e.g. don't invest your time on optimizing rare cases. Quote (imagine app with page flow of Home -> Search -> Product):

>But it’s easy to miss out on these strategic pairings. Let’s say your search results page is where all of the money is made, and so the product team is hesitant to modify it. If we invest our time into improving the home and product pages, making them isomorphic in the process, we won’t see much uptake in client-side rendering. This is because in order to get from the homepage to a product page, most users will navigate _through_ a search results page. Because the search results page is not isomorphic, a server-side render will be required. If we’re not careful, it’s easy to perform a kind of inverse [Pareto optimization](https://en.wikipedia.org/wiki/Pareto_principle), investing 80% of the resources to achieve only 20% of the gains.

