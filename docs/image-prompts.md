# Cookie image assets

These are AI-generated illustrative cookie photographs, created using the built-in `image_gen` tool (not the CLI or API fallback). They are replaceable storefront artwork, not photographs of actual DoughNotDisturb products.

Generated on September 25, 2026. Each output was visually inspected for baked-cookie texture, the requested flavor colors, coherent lighting, and absence of lettering or watermarks. The original PNG files remain under the built-in tool's `CODEX_HOME/generated_images` destination; production copies are committed inside this project.

| Asset | Production file | Size |
| --- | --- | --- |
| Assortment hero | `public/cookies/hero.webp` | 1536 × 1024 |
| Matcha Neapolitan | `public/cookies/matcha.webp` | 960 × 960 |
| Biscoff Chai | `public/cookies/biscoff.webp` | 960 × 960 |
| Mango Lassi | `public/cookies/mango.webp` | 960 × 960 |

The PNG outputs were resized without enlargement and encoded with Sharp as WebP at quality 87. No compositing or retouching was performed. Next.js Image handles responsive delivery. To replace the artwork, save real product photographs at these same paths (or update the presentation catalog's image references); keep square product crops and a 3:2 hero crop. Review descriptive alt text when the subject changes. Image references and descriptions belong to presentation data, not pricing rules.

## Exact generation prompts

### hero

```text
Use case: photorealistic-natural
Asset type: boutique cookie storefront hero photograph, landscape.
Primary request: warm editorial food photography of handmade cookies, real appetizing baked texture.
Scene/backdrop: warm ivory tabletop with a simple cream ceramic plate, softly crumpled parchment and a loosely draped olive linen cloth near one edge.
Subject: a carefully casual assortment of thick cookies: three-section matcha/vanilla/strawberry Neapolitan cookies in soft sage green, vanilla cream, and pale rosy pink; golden chai-spiced Biscoff cookies with cinnamon-brown cracked surfaces; sunny mango lassi cookies with a little pale ivory glaze.
Composition/framing: close overhead at a slight angle, full ceramic plate centered with seven or eight cookies overlapping naturally, a couple crumbs, generous visible table around the plate, landscape 3:2.
Lighting/mood: warm natural window daylight, soft directional shadows, quiet welcoming bakery mood, refined magazine editorial quality.
Materials/textures: distinctly baked edges, tiny fissures, tender centers, matte ceramic, tactile linen and parchment.
Constraints: no text, lettering, logos, watermarks, people, hands, cutlery, illustrations, or artificial plastic food.
```

### matcha

```text
Use case: photorealistic-natural
Asset type: square boutique cookie storefront product photograph.
Primary request: warm editorial food photograph of handmade Matcha Neapolitan cookies.
Scene/backdrop: warm ivory parchment on a cream tabletop, understated warm neutral background.
Subject: three thick round cookies, each one clearly made from three softly joined broad sections of sage-green matcha, rosy pastel strawberry, and pale vanilla dough. The main cookie is fully visible, centered and closest to camera; two cookies sit partly behind.
Composition/framing: square, close three-quarter overhead food photograph, cookies occupy around 70% of frame with comfortable space around, natural overlap.
Lighting/mood: soft directional warm window daylight from upper left, gentle realistic shadows, refined boutique bakery editorial.
Materials/textures: rough homemade craggy surface, light browned edges, delicate sugar grains, tender baked center; realistic modest colors, no vivid neon green.
Constraints: no text, logos, labels, watermarks, people, hands, props, icing, chocolate chips, illustrations, or plastic food.
```

### biscoff

```text
Use case: photorealistic-natural
Asset type: square boutique cookie storefront product photograph.
Primary request: warm editorial food photograph of handmade Biscoff Chai cookies.
Scene/backdrop: warm ivory parchment on a cream tabletop, understated warm neutral background.
Subject: three thick round golden chai-spiced cookies with caramel brown sugar cracks, warm cinnamon flecks, and lightly browned edges. Main cookie fully visible and centered, two cookies partly behind.
Composition/framing: square, close three-quarter overhead food photograph, cookies occupy around 70% of frame with comfortable space around, natural overlap.
Lighting/mood: soft directional warm window daylight from upper left, gentle realistic shadows, refined boutique bakery editorial.
Materials/textures: rough homemade craggy baked surface, fine sugar grains, tender slightly raised center, natural toasted golden-brown tones.
Constraints: no text, logos, labels, watermarks, people, hands, props, branded biscuits, icing, chocolate chips, illustrations, or plastic food.
```

### mango

```text
Use case: photorealistic-natural
Asset type: square boutique cookie storefront product photograph.
Primary request: warm editorial food photograph of handmade Mango Lassi cookies.
Scene/backdrop: warm ivory parchment on a cream tabletop, understated warm neutral background.
Subject: three thick round sunny golden mango cookies with a delicate pale ivory yogurt glaze casually drizzled across their surfaces, subtle mango-gold baked centers and lightly browned edges. Main cookie fully visible and centered, two cookies partly behind.
Composition/framing: square, close three-quarter overhead food photograph, cookies occupy around 70% of frame with comfortable space around, natural overlap.
Lighting/mood: soft directional warm window daylight from upper left, gentle realistic shadows, refined boutique bakery editorial.
Materials/textures: rough homemade craggy baked surfaces beneath thin glaze, tender raised centers, natural muted mango-yellow tones.
Constraints: no text, logos, labels, watermarks, people, hands, props, fruit garnish, chocolate chips, illustrations, or plastic food.
```

