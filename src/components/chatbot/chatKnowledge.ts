export interface ChatAction {
  label: string;
  href: string;
  external?: boolean;
  variant?: 'primary' | 'secondary';
  type?: 'live' | undefined;
}

export interface ChatResponse {
  message: string;
  actions?: ChatAction[];
}

const ROUTES = {
  products: '/products',
  configurationSelector: '/configuration-selector',
  requestQuote: '/request-quote',
  contact: '/contact',
};

const WHATSAPP_MESSAGE = encodeURIComponent(
  'Hello Oak Cherry Kraft, I came through your website assistant and would like to speak with someone.'
);

const WHATSAPP_URL = `https://wa.me/2348034291245?text=${WHATSAPP_MESSAGE}`;
const PHONE_1 = '07035000174';
const PHONE_2 = '08034291245';
const BUSINESS_LOCATIONS_MESSAGE = `Oak Cherry Kraft has two locations:
FHA Guzape, Abuja, Federal Capital Territory, Nigeria
Shonibare Estate, Lagos State, Nigeria`;

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’‘“”'`]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const hasAny = (text: string, patterns: string[]) =>
  patterns.some((pattern) => {
    const normalizedPattern = normalize(pattern);
    if (!normalizedPattern) return false;
    const regex = new RegExp(`\\b${escapeRegExp(normalizedPattern)}\\b`, 'i');
    return regex.test(text);
  });

function createHandoverActions(): ChatAction[] {
  return [
    { label: 'Start Live Chat', href: 'start-live-chat', type: 'live', variant: 'primary' },
    { label: 'WhatsApp Us', href: WHATSAPP_URL, external: true },
    { label: `Call ${PHONE_1}`, href: `tel:${PHONE_1}`, external: true },
    { label: `Call ${PHONE_2}`, href: `tel:${PHONE_2}`, external: true },
    { label: 'Request a Quote', href: ROUTES.requestQuote },
    { label: 'Contact Studio', href: ROUTES.contact },
  ];
}

function createQuickActions(): ChatAction[] {
  return [
    { label: 'Explore Products', href: ROUTES.products },
    { label: 'Custom Furniture', href: ROUTES.configurationSelector },
    { label: 'Configure Furniture', href: ROUTES.configurationSelector },
    { label: 'Request a Quote', href: ROUTES.requestQuote },
    { label: 'Talk to a Human', href: 'start-live-chat', type: 'live' },
    { label: 'Visit Our Studio', href: ROUTES.contact },
  ];
}

export function getChatResponse(
  message: string,
  conversation: Array<{ role: string; content: string }>
): ChatResponse {
  const normalized = normalize(message);

  const greetingPatterns = [
    'hello',
    'hi',
    'hey',
    'good morning',
    'good afternoon',
    'good evening',
    'welcome',
  ];

  const generalHelpPatterns = [
    'what can you help me with',
    'what can i ask you',
    'how can you help me',
    'how can you help me with furniture',
    'what can i ask about',
    'what can you help',
    'what can i ask',
  ];

  const handoverPatterns = [
    // direct asks for an agent / human (common phrasing and variants)
    'i want to speak with an agent',
    'i want to speak to an agent',
    'i want to talk to an agent',
    'can i speak to an agent',
    'can i speak with an agent',
    'can i talk to someone',
    'i want to speak to someone',
    'i want to speak with someone',
    'i need to speak to someone',
    'i need to speak with someone',
    'let me speak to an agent',
    'connect me to an agent',
    'connect me with an agent',
    'can you connect me with someone',
    'i want a human',
    'i need a human',
    'i want to talk to a human',
    'i need a real person',
    'i want a real person',
    'i want customer service',
    'can i talk to customer service',
    'can i speak with someone from oak cherry kraft',
    'i want to speak with someone from oak cherry kraft',
    'please connect me with your team',
    'can someone from oak cherry kraft contact me',
    'agent please',
    'human please',
    'talk to someone please',
    'i need an agent',
    'i want to speak to someone',
    'can someone help me',
    'connect me to team',
    'can someone call me',
    'customer service',
    'contact someone',
    'human',
    'call me',
    'talk to someone',
    'connect me to the team',
    'connect me to someone',
    'connect me',
  ];

  const referencePatterns = [
    'picture',
    'photo',
    'image',
    'drawing',
    'sketch',
    'reference',
    'inspiration',
    'copy this design',
    'build what i saw online',
    'i have a picture',
    'can i send you',
    'can i send a photo',
    'can i send a sketch',
    'can i send a drawing',
    'can i send a drawing',
    'can i send a picture',
    'can i send a reference image',
    'can i send a reference',
    'can i give you a colour reference',
    'i have a design',
    'i have a design i want you to make',
    'i have my own design',
    'i have a design i want',
    'i designed a',
    'i designed',
    'make something similar',
    'make something similar to this',
    'can you make something i designed',
    'i designed a table can you make it',
    'build this design',
    'copy this',
    'similar design',
    'something i designed',
    'i saw something online',
    'can you make something similar',
    'can you make something similar to this',
    'can you build this',
    'can you build this design',
    'can you build this design',
  ];

  const quotePatterns = [
    'request a quote',
    'request quote',
    'quote',
    'pricing',
    'price',
    'prices',
    'price list',
    'cost',
    'expensive',
    'how much',
    'how much is',
    'how much does',
    'how much for',
    'how much does your furniture cost',
    'how much is a table',
    'can i get a quote',
    'get a quote',
    'what is your pricing',
    'what are your prices',
  ];

  const configurationPatterns = [
    'configuration selector',
    'configurator',
    'configure furniture',
    'configure my furniture',
    'how do i configure furniture',
    'i want to configure furniture',
    'where do i configure my furniture',
    'configure',
    'requirements',
    'specifications',
    'what information',
    'what do i need to provide',
    'what specifications do you need',
    'what information do i need',
  ];

  const deliveryPatterns = [
    'deliver',
    'delivery',
    'shipping',
    'where do you deliver',
    'outside nigeria',
    'ship outside nigeria',
    'shipping outside nigeria',
    'do you ship outside nigeria',
    'do you ship internationally',
    'ship internationally',
    'shipping internationally',
    'internationally',
    'international delivery',
    'outside abuja',
    'do you deliver in lagos',
    'do you deliver outside abuja',
    'do you deliver outside nigeria',
  ];

  const deliveryPricingPatterns = [
    'how much does delivery cost',
    'what is your delivery charge',
    'delivery cost',
    'delivery charge',
    'shipping cost',
    'delivery pricing',
  ];

  const installationPatterns = [
    'installation',
    'furniture installation',
    'is installation included',
    'install furniture',
    'do you install furniture',
    'do you provide installation',
    'assembly',
    'assemble',
    'assembling',
    'setup',
  ];

  const physicalLocationPatterns = [
    'where are you located',
    'where is oak cherry kraft located',
    'where are your locations',
    'lagos location',
    'abuja location',
    'located in lagos',
    'located in abuja',
    'do you have a lagos location',
    'do you have an abuja location',
    'are you in lagos',
    'are you in abuja',
    'is oak cherry kraft in lagos',
    'is oak cherry kraft in abuja',
    'what is your address',
    'what are your addresses',
    'what is your lagos address',
    'what is your abuja address',
    'what is the lagos address',
    'what is the abuja address',
    'lagos address',
    'abuja address',
    'where can i visit oak cherry kraft',
    'where can i visit you',
    'where is your studio',
    'where are your studios',
    'where can i find oak cherry kraft',
    'can i visit your studio',
  ];

  const commercialPatterns = [
    'office furniture',
    'business',
    'commercial',
    'commercial project',
    'commercial projects',
    'commercial space',
    'restaurant',
    'restaurants',
    'hotel',
    'hotels',
    'hospitality',
    'property developer',
    'office',
    'offices',
    'workplace',
    'workplaces',
    'retail',
    'for an office',
    'for offices',
    'work with hotels',
    'work with hotel',
    'can you work with hotels',
    'can you make furniture for an office',
    'business furniture',
  ];

  const homeFurnishingPatterns = [
    'entire home',
    'whole house',
    'furnish my house',
    'furnish my home',
    'home furniture',
    'house furniture',
    'whole home',
    'entire home furniture',
  ];

  const designerPatterns = [
    'interior designer',
    'interior designers',
    'architect',
    'architects',
    'designer',
    'design professional',
    'project professional',
    'can my designer',
    'work with architects',
    'work with interior designers',
    'can you work with architects',
    'can you work with interior designers',
    'do you work with architects',
    'do you work with interior designers',
  ];

  const customReferencePatterns = [
    'can you make something i designed',
    'i designed a table can you make it',
  ];

  const customPatterns = [
    'do you make custom furniture',
    'can you make custom furniture',
    'can you build a custom table',
    'can you make a custom chair',
    'i want bespoke furniture',
    'i need bespoke furniture',
    'can you make furniture to my specifications',
    'custom furniture',
    'bespoke furniture',
    'bespoke',
    'can i choose my own dimensions',
    'can i choose my own material',
    'can you make something for me',
    'can you make this for me',
    'can you build a custom',
    'can you make a custom piece',
    'can you make something to my specifications',
    'material preference',
    'colour preference',
    'finish preference',
    'upholstery preference',
    'hardware preference',
    'need custom',
    'want custom',
    'custom design',
    'make to my specifications',
    'make to my specification',
    'my own dimensions',
    'my own design',
    'my design',
    'designed by me',
    'my drawing',
    'my sketch',
    'my picture',
    'make it for me',
    'can you make it',
  ];

  const productPatterns = [
    'what furniture do you make',
    'what products do you have',
    'what do you make',
    'furniture',
    'table',
    'tables',
    'chair',
    'chairs',
    'desk',
    'desks',
    'wardrobe',
    'wardrobes',
    'do you make tables',
    'do you make desks',
    'do you make wardrobes',
    'do you make chairs',
    'do you make storage furniture',
    'storage',
    'interior pieces',
    'catalogue',
    'products',
  ];

  const materialsPatterns = [
    'wood',
    'solid wood',
    'engineered wood',
    'plywood',
    'metal',
    'glass',
    'upholstery',
    'fabric',
    'hardware',
    'material',
    'materials',
    'can i choose my own materials',
    'can i choose the material',
    'can i choose the materials',
  ];

  const colourPatterns = [
    'colour',
    'color',
    'colors',
    'colours',
    'paint',
    'stain',
    'finish',
    'custom colour',
    'can i choose my own colour',
    'can i choose the colour',
    'can i choose the finish',
    'colour code',
    'color code',
    'colour reference',
    'color reference',
    'finish reference',
    'colour sample',
  ];

  const aboutPatterns = [
    'what does oak cherry do',
    'what does oak cherry kraft do',
    'what do you guys do',
    'what is oak cherry kraft',
    'who are you',
    'tell me about oak cherry kraft',
    'what do you do',
    'what kind of company are you',
    'what kind of business are you',
  ];

  const founderPatterns = [
    'who founded oak cherry kraft',
    'who is the founder',
    'who founded you',
    'founder',
  ];

  const foundedPatterns = [
    'when was oak cherry kraft founded',
    'when were you founded',
    'founded in',
    'when were you started',
    'when did oak cherry kraft start',
    'when did you start',
  ];

  const warrantyPatterns = [
    'warranty',
    'repair',
    'fault',
    'damaged furniture',
    'my furniture is damaged',
    'can you repair furniture',
    'i need a repair',
    'after sales',
    'maintenance',
  ];

  const returnPatterns = [
    'return',
    'return my furniture',
    'refund',
    'refund my furniture',
    'exchange',
    'exchange my furniture',
    'replace',
    'replacement',
    'cancellation',
  ];

  const paymentPatterns = [
    'payment',
    'deposit',
    'installment',
    'installment plan',
    'installments',
    'instalments',
    'payment terms',
    'payment method',
    'payment methods',
    'bank details',
    'method of payment',
    'pay in installments',
    'pay in instalments',
    'payment plan',
    'how do i pay',
    'how can i pay',
    'can i pay in installments',
    'can i pay in instalments',
  ];

  const productionPatterns = [
    'how long',
    'lead time',
    'when will',
    'how many weeks',
    'how soon',
    'ready',
    'finish before',
    'completed',
    'production time',
    'how long does custom furniture take',
    'how long will my furniture take',
    'when will my furniture be ready',
  ];

  const availabilityPatterns = [
    'in stock',
    'available',
    'availability',
    'stock',
    'currently have',
    'do you have this in stock',
    'is this available',
    'do you have tables in stock',
  ];

  if (!normalized) {
    return {
      message:
        'I did not receive a question. Please type your request so I can help you with Oak Cherry Kraft furniture, quotes, delivery, or contact details.',
      actions: createQuickActions(),
    };
  }

  if (hasAny(normalized, handoverPatterns)) {
    return {
      message: `Absolutely. I can connect you with the Oak Cherry Kraft team. You can reach the team directly through WhatsApp or phone.`,
      actions: createHandoverActions(),
    };
  }

  if (hasAny(normalized, [...warrantyPatterns, ...returnPatterns])) {
    return {
      message: `I don't want to give you incorrect information. That detail needs to be confirmed by the Oak Cherry Kraft team.`,
      actions: createHandoverActions(),
    };
  }

  if (hasAny(normalized, [...deliveryPricingPatterns, 'how much does delivery cost', 'what is your delivery charge'])) {
    return {
      message: `Delivery pricing is assessed based on location, size, quantity, weight, and accessibility. Delivery charges are confirmed for the specific order, and international delivery requires separate confirmation. Please confirm your delivery requirements with the Oak Cherry Kraft team.`,
      actions: createHandoverActions(),
    };
  }

  if (hasAny(normalized, customReferencePatterns)) {
    return {
      message: `Yes. Oak Cherry Kraft can build your custom design. Please share your design reference, sketch, drawing, photo, or inspiration so the team can review it for feasibility, dimensions, materials, and production requirements.`,
      actions: createHandoverActions(),
    };
  }

  if (hasAny(normalized, ['how long does custom furniture take', 'how long will my furniture take', 'when will my furniture be ready'])) {
    return {
      message: `Production timing depends on the specific project and requirements. Oak Cherry Kraft needs to assess your furniture request before confirming lead time or completion timing.`,
      actions: createHandoverActions(),
    };
  }

  if (hasAny(normalized, customReferencePatterns)) {
    return {
      message: `Yes. Oak Cherry Kraft can build your custom design. Please share your design reference, sketch, drawing, photo, or inspiration so the team can review it for feasibility, dimensions, materials, and production requirements.`,
      actions: createHandoverActions(),
    };
  }

  if (hasAny(normalized, customPatterns)) {
    return {
      message: `Oak Cherry Kraft can build custom furniture to your specifications. Use the Configuration Selector to share type, dimensions, materials, finishes, and design details, and the team will review your request.`,
      actions: [
        { label: 'Open Configuration Selector', href: ROUTES.configurationSelector },
        { label: 'Request a Quote', href: ROUTES.requestQuote },
      ],
    };
  }

  if (hasAny(normalized, configurationPatterns)) {
    return {
      message: `The Configuration Selector helps you provide furniture requirements such as type, dimensions, materials, finishes, colours, quantity, and reference details. After submission, Oak Cherry Kraft reviews the request and determines what can be produced.`,
      actions: [
        { label: 'Open Configuration Selector', href: ROUTES.configurationSelector },
        { label: 'Request a Quote', href: ROUTES.requestQuote },
      ],
    };
  }

  if (hasAny(normalized, installationPatterns)) {
    return {
      message: `Installation may be available depending on the product, order, location, and requirements. Installation is assessed separately from delivery and is not automatically included.`,
      actions: createHandoverActions(),
    };
  }

  if (hasAny(normalized, quotePatterns)) {
    return {
      message: `Pricing depends on size, material, finish, design, quantity, and project specifications. Oak Cherry Kraft needs to assess your specific requirements before confirming a price.`,
      actions: [
        { label: 'Request a Quote', href: ROUTES.requestQuote },
        { label: 'Configure Furniture', href: ROUTES.configurationSelector },
      ],
    };
  }

  if (hasAny(normalized, ['can i give you a colour reference'])) {
    return {
      message: `Yes. Oak Cherry Kraft can build your custom design. Please share your design reference, sketch, drawing, photo, or inspiration so the team can review it for feasibility, dimensions, materials, and production requirements.`,
      actions: createHandoverActions(),
    };
  }

  if (hasAny(normalized, colourPatterns)) {
    return {
      message: `Custom colours and finishes can be requested, subject to suitability and confirmation. Please share a colour reference, image, or colour code so the team can review it for the chosen material and design.`,
      actions: [
        { label: 'Configure Furniture', href: ROUTES.configurationSelector },
        { label: 'Request a Quote', href: ROUTES.requestQuote },
      ],
    };
  }

  if (hasAny(normalized, referencePatterns)) {
    return {
      message: `Yes. You can provide reference images, photographs, drawings, sketches, or design inspiration. Oak Cherry Kraft uses the reference as a design guide, and the final piece may need adjustments based on materials, dimensions, construction, functionality, and production requirements.`,
      actions: createHandoverActions(),
    };
  }

  if (hasAny(normalized, physicalLocationPatterns)) {
    return {
      message: `${BUSINESS_LOCATIONS_MESSAGE}\n\nPlease contact the studio before visiting.`,
      actions: [
        { label: 'Visit Our Studio', href: ROUTES.contact },
        { label: 'Contact Studio', href: ROUTES.contact },
      ],
    };
  }

  if (hasAny(normalized, commercialPatterns)) {
    return {
      message: `Oak Cherry Kraft works with residential and commercial customers, including offices, restaurants, hotels, and hospitality spaces. Larger projects are assessed based on specifications, quantity, timeline, materials, and project requirements.`,
      actions: [
        { label: 'Request a Quote', href: ROUTES.requestQuote },
        { label: 'Configure Furniture', href: ROUTES.configurationSelector },
      ],
    };
  }

  if (hasAny(normalized, designerPatterns)) {
    return {
      message: `Oak Cherry Kraft can assess projects involving interior designers, architects, and other project professionals. Please share your project requirements and design references so the team can review the details.`,
      actions: [
        { label: 'Contact Studio', href: ROUTES.contact },
        { label: 'Request a Quote', href: ROUTES.requestQuote },
      ],
    };
  }

  if (hasAny(normalized, availabilityPatterns)) {
    return {
      message: `Availability and stock status need to be confirmed by the Oak Cherry Kraft team. For custom furniture, requirements are assessed before production.`,
      actions: createHandoverActions(),
    };
  }

  if (hasAny(normalized, productionPatterns)) {
    return {
      message: `Production timing depends on the specific project and requirements. Oak Cherry Kraft needs to assess your furniture request before confirming lead time or completion timing.`,
      actions: createHandoverActions(),
    };
  }

  if (hasAny(normalized, paymentPatterns)) {
    return {
      message: `Payment terms need to be confirmed by the Oak Cherry Kraft team. I can help you contact them on WhatsApp or by phone.`,
      actions: createHandoverActions(),
    };
  }

  if (hasAny(normalized, productPatterns)) {
    return {
      message: `Oak Cherry Kraft focuses on tables, chairs, storage furniture, and interior pieces shown in the current catalogue. The studio also assesses custom requests based on design, dimensions, materials, functionality, quantity, and production requirements.`,
      actions: [
        { label: 'Explore Products', href: ROUTES.products },
        { label: 'Request a Quote', href: ROUTES.requestQuote },
      ],
    };
  }

  if (hasAny(normalized, deliveryPatterns)) {
    return {
      message: `Oak Cherry Kraft serves customers all over Nigeria and outside Nigeria. Delivery outside Nigeria requires specific confirmation and logistics. Delivery depends on location, size, quantity, weight, and accessibility.`,
      actions: createHandoverActions(),
    };
  }

  if (hasAny(normalized, generalHelpPatterns)) {
    return {
      message: `I can help with Oak Cherry Kraft products, custom furniture, configuration, quotes, materials, delivery, installation, studio information, and connecting you with our team. Which would you like help with?`,
      actions: createQuickActions(),
    };
  }

  if (hasAny(normalized, greetingPatterns) && normalized.split(' ').length <= 3) {
    return {
      message: `Hi! I'm OAKIES, your Oak Cherry Kraft assistant. I can help you explore our furniture, discuss custom designs, request a quote, or connect you with our team.`,
      actions: createQuickActions(),
    };
  }

  if (hasAny(normalized, customPatterns)) {
    return {
      message: `Oak Cherry Kraft can build custom furniture to your specifications. Use the Configuration Selector to share type, dimensions, materials, finishes, and reference details, and the team will review your request.`,
      actions: [
        { label: 'Open Configuration Selector', href: ROUTES.configurationSelector },
        { label: 'Request a Quote', href: ROUTES.requestQuote },
      ],
    };
  }

  if (hasAny(normalized, quotePatterns)) {
    return {
      message: `Pricing depends on size, material, finish, design, quantity, and project specifications. Oak Cherry Kraft needs to assess your specific requirements before confirming a price.`,
      actions: [
        { label: 'Request a Quote', href: ROUTES.requestQuote },
        { label: 'Configure Furniture', href: ROUTES.configurationSelector },
      ],
    };
  }

  if (hasAny(normalized, configurationPatterns)) {
    return {
      message: `The Configuration Selector helps you provide furniture requirements such as type, dimensions, materials, finishes, colours, quantity, and reference details. After submission, Oak Cherry Kraft reviews the request and determines what can be produced.`,
      actions: [
        { label: 'Open Configuration Selector', href: ROUTES.configurationSelector },
        { label: 'Request a Quote', href: ROUTES.requestQuote },
      ],
    };
  }

  if (hasAny(normalized, installationPatterns)) {
    return {
      message: `Installation may be available depending on the product, order, location, and requirements. Installation is assessed separately from delivery and is not automatically included.`,
      actions: createHandoverActions(),
    };
  }

  if (hasAny(normalized, physicalLocationPatterns)) {
    return {
      message: `${BUSINESS_LOCATIONS_MESSAGE}\n\nPlease contact the studio before visiting.`,
      actions: [
        { label: 'Visit Our Studio', href: ROUTES.contact },
        { label: 'Contact Studio', href: ROUTES.contact },
      ],
    };
  }

  if (hasAny(normalized, commercialPatterns)) {
    return {
      message: `Oak Cherry Kraft works with residential and commercial customers, including offices, restaurants, hotels, and hospitality spaces. Larger projects are assessed based on specifications, quantity, timeline, materials, and project requirements.`,
      actions: [
        { label: 'Request a Quote', href: ROUTES.requestQuote },
        { label: 'Configure Furniture', href: ROUTES.configurationSelector },
      ],
    };
  }

  if (hasAny(normalized, homeFurnishingPatterns)) {
    return {
      message: `Oak Cherry Kraft can assess an entire home furniture project. Please share the furniture types, number of pieces, dimensions, materials, finishes, reference images, and delivery location so the team can review your project.`,
      actions: [
        { label: 'Request a Quote', href: ROUTES.requestQuote },
        { label: 'Configure Furniture', href: ROUTES.configurationSelector },
      ],
    };
  }

  if (hasAny(normalized, designerPatterns)) {
    return {
      message: `Oak Cherry Kraft can assess projects involving interior designers, architects, and other project professionals. Please share your project requirements and design references so the team can review the details.`,
      actions: [
        { label: 'Contact Studio', href: ROUTES.contact },
        { label: 'Request a Quote', href: ROUTES.requestQuote },
      ],
    };
  }

  if (hasAny(normalized, founderPatterns)) {
    return {
      message: `Oak Cherry Kraft was founded in 2023 by Adeyemo Rhodes-Vivour.`,
      actions: [
        { label: 'Explore Products', href: ROUTES.products },
        { label: 'Contact Studio', href: ROUTES.contact },
      ],
    };
  }

  if (hasAny(normalized, foundedPatterns)) {
    return {
      message: `Oak Cherry Kraft was founded in 2023.`,
      actions: [
        { label: 'Explore Products', href: ROUTES.products },
        { label: 'Contact Studio', href: ROUTES.contact },
      ],
    };
  }

  if (hasAny(normalized, aboutPatterns)) {
    return {
      message: `Oak Cherry Kraft creates custom and bespoke furniture, plus interior pieces designed around each customer's space, style, functionality, and requirements. ${BUSINESS_LOCATIONS_MESSAGE}`,
      actions: [
        { label: 'Explore Products', href: ROUTES.products },
        { label: 'Design Custom Furniture', href: ROUTES.configurationSelector },
        { label: 'Contact Studio', href: ROUTES.contact },
      ],
    };
  }

  if (hasAny(normalized, productPatterns)) {
    return {
      message: `Oak Cherry Kraft focuses on tables, chairs, storage furniture, and interior pieces shown in the current catalogue. The studio also assesses custom requests based on design, dimensions, materials, functionality, quantity, and production requirements.`,
      actions: [
        { label: 'Explore Products', href: ROUTES.products },
        { label: 'Request a Quote', href: ROUTES.requestQuote },
      ],
    };
  }

  if (hasAny(normalized, materialsPatterns)) {
    return {
      message: `Customers can request specific materials such as solid wood, engineered wood, plywood, metal, glass, upholstery, fabric, and hardware. Oak Cherry Kraft confirms availability, suitability, and compatibility before production.`,
      actions: [
        { label: 'Configure Furniture', href: ROUTES.configurationSelector },
        { label: 'Talk to a Human', href: 'start-live-chat', type: 'live' },
      ],
    };
  }

  if (hasAny(normalized, colourPatterns)) {
    return {
      message: `Custom colours and finishes can be requested, subject to suitability and confirmation. Please share a colour reference, image, or colour code so the team can review it for the chosen material and design.`,
      actions: [
        { label: 'Configure Furniture', href: ROUTES.configurationSelector },
        { label: 'Request a Quote', href: ROUTES.requestQuote },
      ],
    };
  }

  if (hasAny(normalized, [...warrantyPatterns, ...returnPatterns])) {
    return {
      message: `I don't want to give you incorrect information. That detail needs to be confirmed by the Oak Cherry Kraft team.`,
      actions: createHandoverActions(),
    };
  }

  if (hasAny(normalized, paymentPatterns)) {
    return {
      message: `Payment terms need to be confirmed by the Oak Cherry Kraft team. I can help you contact them on WhatsApp or by phone.`,
      actions: createHandoverActions(),
    };
  }

  if (hasAny(normalized, productionPatterns)) {
    return {
      message: `Production timing depends on the specific project and requirements. Oak Cherry Kraft needs to assess your furniture request before confirming lead time or completion timing.`,
      actions: createHandoverActions(),
    };
  }

  if (hasAny(normalized, availabilityPatterns)) {
    return {
      message: `Availability and stock status need to be confirmed by the Oak Cherry Kraft team. For custom furniture, requirements are assessed before production.`,
      actions: createHandoverActions(),
    };
  }

  return {
    message: `I don't want to give you incorrect information. That detail needs to be confirmed by the Oak Cherry Kraft team. I can help you contact the team on WhatsApp or by phone.`,
    actions: createHandoverActions(),
  };
}
