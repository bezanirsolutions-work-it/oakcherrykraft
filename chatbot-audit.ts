import { getChatResponse } from './src/components/chatbot/chatKnowledge.js';

type TestCase = {
  category: string;
  question: string;
  expected: string;
};

const testCases: TestCase[] = [
  { category: 'greeting', question: 'Hello', expected: 'greeting' },
  { category: 'greeting', question: 'Hi', expected: 'greeting' },
  { category: 'greeting', question: 'Good morning', expected: 'greeting' },
  { category: 'greeting', question: 'Good afternoon', expected: 'greeting' },
  { category: 'greeting', question: 'Hey', expected: 'greeting' },
  { category: 'greeting', question: 'What can you help me with?', expected: 'general help' },
  { category: 'greeting', question: 'What can I ask you?', expected: 'general help' },
  { category: 'greeting', question: 'How can you help me?', expected: 'general help' },

  { category: 'about', question: 'What does Oak Cherry Kraft do?', expected: 'about' },
  { category: 'about', question: 'What do you guys do?', expected: 'about' },
  { category: 'about', question: 'What is Oak Cherry Kraft?', expected: 'about' },
  { category: 'about', question: 'Tell me about Oak Cherry Kraft.', expected: 'about' },
  { category: 'about', question: 'Who are you?', expected: 'about' },
  { category: 'about', question: 'What kind of company are you?', expected: 'about' },
  { category: 'about', question: 'What furniture do you make?', expected: 'product' },
  { category: 'about', question: 'What products do you have?', expected: 'product' },
  { category: 'about', question: 'What do you make?', expected: 'product' },

  { category: 'founder', question: 'Who founded Oak Cherry Kraft?', expected: 'founder' },
  { category: 'founder', question: 'Who is the founder?', expected: 'founder' },
  { category: 'founder', question: 'When was Oak Cherry Kraft founded?', expected: 'founded' },
  { category: 'founder', question: 'When were you founded?', expected: 'founded' },
  { category: 'founder', question: 'When did Oak Cherry Kraft start?', expected: 'founded' },

  { category: 'products', question: 'Do you make tables?', expected: 'product' },
  { category: 'products', question: 'Do you make chairs?', expected: 'product' },
  { category: 'products', question: 'Do you make desks?', expected: 'product' },
  { category: 'products', question: 'Do you make storage furniture?', expected: 'product' },
  { category: 'products', question: 'Do you make wardrobes?', expected: 'product' },
  { category: 'products', question: 'Do you make interior pieces?', expected: 'product' },
  { category: 'products', question: 'Can I see your products?', expected: 'product' },
  { category: 'products', question: 'Show me your catalogue.', expected: 'product' },
  { category: 'products', question: 'What furniture can you make?', expected: 'product' },

  { category: 'custom', question: 'Do you make custom furniture?', expected: 'custom' },
  { category: 'custom', question: 'Can you make custom furniture?', expected: 'custom' },
  { category: 'custom', question: 'Can you make something for me?', expected: 'custom' },
  { category: 'custom', question: 'Can you build a custom table?', expected: 'custom' },
  { category: 'custom', question: 'Can you make a custom chair?', expected: 'custom' },
  { category: 'custom', question: 'Can you make something I designed?', expected: 'custom reference' },
  { category: 'custom', question: 'I designed a table, can you make it?', expected: 'custom reference' },
  { category: 'custom', question: 'I want bespoke furniture.', expected: 'custom' },
  { category: 'custom', question: 'I need bespoke furniture.', expected: 'custom' },
  { category: 'custom', question: 'Can I choose my own dimensions?', expected: 'custom' },
  { category: 'custom', question: 'Can I choose my own materials?', expected: 'materials' },
  { category: 'custom', question: 'Can I choose my own colour?', expected: 'colour' },
  { category: 'custom', question: 'Can you make furniture to my specifications?', expected: 'custom' },

  { category: 'reference', question: 'Can I send you a picture?', expected: 'reference' },
  { category: 'reference', question: 'Can I send a photo?', expected: 'reference' },
  { category: 'reference', question: 'Can I send a drawing?', expected: 'reference' },
  { category: 'reference', question: 'Can I send a sketch?', expected: 'reference' },
  { category: 'reference', question: 'Can I send a reference image?', expected: 'reference' },
  { category: 'reference', question: 'I have a design I want you to make.', expected: 'reference' },
  { category: 'reference', question: 'I saw something online. Can you make something similar?', expected: 'reference' },
  { category: 'reference', question: 'Can you build this design?', expected: 'reference' },

  { category: 'configuration', question: 'What is the Configuration Selector?', expected: 'configuration' },
  { category: 'configuration', question: 'How does the configurator work?', expected: 'configuration' },
  { category: 'configuration', question: 'How do I configure furniture?', expected: 'configuration' },
  { category: 'configuration', question: 'I want to configure furniture.', expected: 'configuration' },
  { category: 'configuration', question: 'What information do I need to provide?', expected: 'configuration' },
  { category: 'configuration', question: 'What specifications do you need?', expected: 'configuration' },
  { category: 'configuration', question: 'Where do I configure my furniture?', expected: 'configuration' },

  { category: 'pricing', question: 'How much does your furniture cost?', expected: 'quote' },
  { category: 'pricing', question: 'How much is a table?', expected: 'quote' },
  { category: 'pricing', question: 'What are your prices?', expected: 'quote' },
  { category: 'pricing', question: 'Do you have a price list?', expected: 'quote' },
  { category: 'pricing', question: 'Can I get a quote?', expected: 'quote' },
  { category: 'pricing', question: 'I want a quote.', expected: 'quote' },
  { category: 'pricing', question: 'How do I request a quote?', expected: 'quote' },
  { category: 'pricing', question: 'How much does delivery cost?', expected: 'delivery pricing' },
  { category: 'pricing', question: 'What is your delivery charge?', expected: 'delivery pricing' },

  { category: 'delivery', question: 'Do you deliver?', expected: 'delivery' },
  { category: 'delivery', question: 'Where do you deliver?', expected: 'delivery' },
  { category: 'delivery', question: 'Do you deliver in Lagos?', expected: 'delivery' },
  { category: 'delivery', question: 'Do you deliver in Abuja?', expected: 'delivery' },
  { category: 'delivery', question: 'Do you deliver outside Abuja?', expected: 'delivery' },
  { category: 'delivery', question: 'Do you deliver across Nigeria?', expected: 'delivery' },
  { category: 'delivery', question: 'Do you deliver internationally?', expected: 'delivery' },
  { category: 'delivery', question: 'Do you ship outside Nigeria?', expected: 'delivery' },

  { category: 'installation', question: 'Do you install furniture?', expected: 'installation' },
  { category: 'installation', question: 'Do you provide installation?', expected: 'installation' },
  { category: 'installation', question: 'Is installation included?', expected: 'installation' },
  { category: 'installation', question: 'Can you assemble the furniture?', expected: 'installation' },
  { category: 'installation', question: 'Do you offer assembly?', expected: 'installation' },

  { category: 'studio', question: 'Where is your studio?', expected: 'studio' },
  { category: 'studio', question: 'Where are you located?', expected: 'studio' },
  { category: 'studio', question: 'Can I visit your studio?', expected: 'studio' },
  { category: 'studio', question: 'Can I visit you?', expected: 'studio' },
  { category: 'studio', question: 'Do I need an appointment?', expected: 'studio' },
  { category: 'studio', question: 'Is parking available?', expected: 'studio' },
  { category: 'studio', question: 'What are your opening hours?', expected: 'studio' },
  { category: 'studio', question: 'Are you open on Saturday?', expected: 'studio' },
  { category: 'studio', question: 'Are you open on Sunday?', expected: 'studio' },

  { category: 'commercial', question: 'Can you make furniture for an office?', expected: 'commercial' },
  { category: 'commercial', question: 'Can you furnish an entire office?', expected: 'commercial' },
  { category: 'commercial', question: 'Can you furnish a restaurant?', expected: 'commercial' },
  { category: 'commercial', question: 'Can you work with hotels?', expected: 'commercial' },
  { category: 'commercial', question: 'Do you do commercial projects?', expected: 'commercial' },
  { category: 'commercial', question: 'Can you furnish an entire home?', expected: 'home' },
  { category: 'commercial', question: 'Can you furnish a whole house?', expected: 'home' },
  { category: 'commercial', question: 'Can you work with interior designers?', expected: 'designer' },
  { category: 'commercial', question: 'Do you work with architects?', expected: 'designer' },
  { category: 'commercial', question: 'Can my interior designer work with you?', expected: 'designer' },

  { category: 'materials', question: 'What materials do you use?', expected: 'materials' },
  { category: 'materials', question: 'Do you use solid wood?', expected: 'materials' },
  { category: 'materials', question: 'Can I choose the material?', expected: 'materials' },
  { category: 'materials', question: 'Can I choose the finish?', expected: 'colour' },
  { category: 'materials', question: 'Can I choose the colour?', expected: 'colour' },
  { category: 'materials', question: 'Can I give you a colour reference?', expected: 'reference' },
  { category: 'materials', question: 'Can I provide a colour code?', expected: 'colour' },

  { category: 'warranty', question: 'Do you offer a warranty?', expected: 'fallback' },
  { category: 'warranty', question: 'What is your warranty?', expected: 'fallback' },
  { category: 'warranty', question: 'My furniture is damaged.', expected: 'fallback' },
  { category: 'warranty', question: 'I need a repair.', expected: 'fallback' },
  { category: 'warranty', question: 'Can you repair furniture?', expected: 'fallback' },
  { category: 'warranty', question: 'Can I return my furniture?', expected: 'fallback' },
  { category: 'warranty', question: 'Can I get a refund?', expected: 'fallback' },
  { category: 'warranty', question: 'Can I exchange my furniture?', expected: 'fallback' },

  { category: 'payment', question: 'What payment methods do you accept?', expected: 'payment' },
  { category: 'payment', question: 'Do I need to pay a deposit?', expected: 'payment' },
  { category: 'payment', question: 'Can I pay in installments?', expected: 'payment' },
  { category: 'payment', question: 'What are your payment terms?', expected: 'payment' },
  { category: 'payment', question: 'How do I pay?', expected: 'payment' },

  { category: 'production', question: 'How long does custom furniture take?', expected: 'production' },
  { category: 'production', question: 'What is your lead time?', expected: 'production' },
  { category: 'production', question: 'How long will my furniture take?', expected: 'production' },
  { category: 'production', question: 'When will my furniture be ready?', expected: 'production' },
  { category: 'production', question: 'Do you have this in stock?', expected: 'availability' },
  { category: 'production', question: 'Is this available?', expected: 'availability' },
  { category: 'production', question: 'Do you have tables in stock?', expected: 'availability' },

  { category: 'handover', question: 'I want to speak to someone.', expected: 'handover' },
  { category: 'handover', question: 'Can I talk to a human?', expected: 'handover' },
  { category: 'handover', question: 'I need an agent.', expected: 'handover' },
  { category: 'handover', question: 'Can someone call me?', expected: 'handover' },
  { category: 'handover', question: 'I need customer service.', expected: 'handover' },
  { category: 'handover', question: 'Talk to someone.', expected: 'handover' },
  { category: 'handover', question: 'Connect me to the team.', expected: 'handover' },
];

const isFallback = (message: string) =>
  message.includes("don't want to give you incorrect information") ||
  message.includes('needs to be confirmed by the Oak Cherry Kraft team.');

const inferActualIntent = (test: TestCase, response: ReturnType<typeof getChatResponse>) => {
  const message = response.message;
  const lower = message.toLowerCase();
  const actions = response.actions ?? [];

  if (lower.includes('welcome to oak cherry kraft') || lower.includes('how can i help you today')) {
    return 'greeting';
  }

  if (lower.includes('i can help with oak cherry kraft products')) {
    return 'general help';
  }

  if (lower.includes('i do not want to give you incorrect information') || lower.includes('needs to be confirmed by the oak cherry kraft team')) {
    return 'fallback';
  }

  if (lower.includes('of course. you can speak directly with the oak cherry kraft team')) {
    return 'handover';
  }

  if (lower.includes('oak cherry kraft creates custom and bespoke furniture') || lower.includes('the studio is based in fha guzape')) {
    return 'about';
  }

  if (lower.includes('oak cherry kraft was founded in 2023') && lower.includes('adeyemo')) {
    return 'founder';
  }

  if (lower.includes('oak cherry kraft was founded in 2023.') || lower.includes('oak cherry kraft was founded in 2023')) {
    return 'founded';
  }

  if (lower.includes('oak cherry kraft focuses on tables, chairs, storage furniture') || lower.includes('current catalogue')) {
    return 'product';
  }

  if (lower.includes('custom furniture to your specifications') && lower.includes('configuration selector')) {
    return 'custom';
  }

  if (((lower.includes('build your custom design') || lower.includes('custom design') || lower.includes('your custom design')) &&
      (lower.includes('reference') || lower.includes('design') || lower.includes('sketch') || lower.includes('drawing') || lower.includes('photo') || lower.includes('inspiration'))) &&
      !lower.includes('colour') && !lower.includes('colour reference') && !lower.includes('colour code')) {
    return 'custom reference';
  }

  if (lower.includes('provide reference images') || lower.includes('design inspiration') || lower.includes('reference as a design guide')) {
    return 'reference';
  }

  if (lower.includes('the configuration selector helps you provide furniture requirements')) {
    return 'configuration';
  }

  if (lower.includes('pricing depends on size, material, finish, design')) {
    return 'quote';
  }

  if ((lower.includes('delivery') || lower.includes('shipping')) &&
      (lower.includes('cost') || lower.includes('price') || lower.includes('pricing') || lower.includes('charge') || lower.includes('charges') || lower.includes('fee'))) {
    return 'delivery pricing';
  }

  if (lower.includes('oak cherry kraft delivers across nigeria')) {
    return 'delivery';
  }

  if (lower.includes('installation may be available depending on the product')) {
    return 'installation';
  }

  if (lower.includes('oak cherry kraft is located in fha guzape')) {
    return 'studio';
  }

  if (lower.includes('works with residential and commercial customers') || lower.includes('larger projects are assessed')) {
    return 'commercial';
  }

  if (lower.includes('assess an entire home furniture project')) {
    return 'home';
  }

  if (lower.includes('projects involving interior designers, architects, and other project professionals')) {
    return 'designer';
  }

  if (lower.includes('customers can request specific materials such as solid wood')) {
    return 'materials';
  }

  if (lower.includes('custom colours and finishes can be requested')) {
    return 'colour';
  }

  if (lower.includes('payment terms need to be confirmed by the oak cherry kraft team')) {
    return 'payment';
  }

  if (lower.includes('production timing depends on the specific project and requirements')) {
    return 'production';
  }

  if (lower.includes('availability and stock status need to be confirmed by the oak cherry kraft team')) {
    return 'availability';
  }

  if (actions.some((action) => action.href === '/configuration-selector') && actions.some((action) => action.href === '/request-quote')) {
    return 'custom';
  }

  if (test.expected === 'custom reference' && lower.includes('reference')) {
    return 'reference';
  }

  return 'ambiguous';
};

const categories = testCases.map((test) => {
  const response = getChatResponse(test.question, []);
  const actual = inferActualIntent(test, response);
  const result = actual === test.expected ? 'PASS' : actual === 'ambiguous' ? 'AMBIGUOUS' : 'FAIL';

  return {
    ...test,
    message: response.message,
    actual,
    result,
    actions: response.actions ?? [],
    hasProducts: response.actions?.some((action) => action.href === '/products') ?? false,
    hasConfiguration: response.actions?.some((action) => action.href === '/configuration-selector') ?? false,
    hasQuote: response.actions?.some((action) => action.href === '/request-quote') ?? false,
    hasContact: response.actions?.some((action) => action.href === '/contact') ?? false,
    hasWhatsApp: response.actions?.some((action) => action.href.startsWith('https://wa.me/')) ?? false,
    hasPhone: response.actions?.some((action) => action.href.startsWith('tel:')) ?? false,
    fallback: isFallback(response.message),
  };
});

for (const item of categories) {
  console.log(`QUESTION: ${item.question}`);
  console.log(`EXPECTED: ${item.expected}`);
  console.log(`ACTUAL: ${item.actual}`);
  console.log(`MESSAGE: ${item.message}`);
  console.log(`RESULT: ${item.result}`);
  console.log('----');
}

const passCount = categories.filter((item) => item.result === 'PASS').length;
const failCount = categories.filter((item) => item.result === 'FAIL').length;
const ambiguousCount = categories.filter((item) => item.result === 'AMBIGUOUS').length;

console.log('=== AUDIT SUMMARY ===');
console.log(`PASS: ${passCount}`);
console.log(`FAIL: ${failCount}`);
console.log(`AMBIGUOUS: ${ambiguousCount}`);
console.log(`TOTAL: ${categories.length}`);

const failures = categories.filter((item) => item.result === 'FAIL');
if (failures.length > 0) {
  console.log('=== FAILURES ===');
  for (const item of failures) {
    console.log(`QUESTION: ${item.question}`);
    console.log(`EXPECTED: ${item.expected}`);
    console.log(`ACTUAL: ${item.actual}`);
    console.log(`MESSAGE: ${item.message}`);
    console.log('----');
  }
}

const ambiguous = categories.filter((item) => item.result === 'AMBIGUOUS');
if (ambiguous.length > 0) {
  console.log('=== AMBIGUOUS ===');
  for (const item of ambiguous) {
    console.log(`QUESTION: ${item.question}`);
    console.log(`EXPECTED: ${item.expected}`);
    console.log(`ACTUAL: ${item.actual}`);
    console.log(`MESSAGE: ${item.message}`);
    console.log('----');
  }
}

console.log(`TOTAL=${categories.length}`);
