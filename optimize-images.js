import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function optimizeImages() {
  // Chatbot icon: 1536×1024 -> 256px width (in src/assets)
  const chatbotSrc = path.join(__dirname, 'src/assets/chatbot-icon.webp');
  const chatbotDest = path.join(__dirname, 'src/assets/chatbot-icon-mobile.webp');
  
  // Logo: 1071×1008 -> 128px width
  const logoSrc = path.join(__dirname, 'public/assets/logo/LOGO.webp');
  const logoDest = path.join(__dirname, 'public/assets/logo/LOGO-mobile.webp');
  
  try {
    // Optimize chatbot (resize to 256px width)
    const chatInfo = await sharp(chatbotSrc).metadata();
    const chatHeight = Math.round(256 * chatInfo.height / chatInfo.width);
    
    await sharp(chatbotSrc)
      .resize(256, chatHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 80 })
      .toFile(chatbotDest);
    
    const chatSize = fs.statSync(chatbotDest).size;
    const chatOrigSize = fs.statSync(chatbotSrc).size;
    console.log(`chatbot-icon.webp: 1536x1024 -> 256x${chatHeight} | ${chatOrigSize} -> ${chatSize} bytes (saved ${((chatOrigSize-chatSize)/chatOrigSize*100).toFixed(1)}%)`);
    
    // Optimize logo (resize to 128px width)
    const logoInfo = await sharp(logoSrc).metadata();
    const logoHeight = Math.round(128 * logoInfo.height / logoInfo.width);
    
    await sharp(logoSrc)
      .resize(128, logoHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 85 })
      .toFile(logoDest);
    
    const logoSize = fs.statSync(logoDest).size;
    const logoOrigSize = fs.statSync(logoSrc).size;
    console.log(`LOGO.webp: 1071x1008 -> 128x${logoHeight} | ${logoOrigSize} -> ${logoSize} bytes (saved ${((logoOrigSize-logoSize)/logoOrigSize*100).toFixed(1)}%)`);
    
    // Also create a 256px version for better desktop quality
    const logo256Dest = path.join(__dirname, 'public/assets/logo/LOGO-256.webp');
    const logoHeight256 = Math.round(256 * logoInfo.height / logoInfo.width);
    
    await sharp(logoSrc)
      .resize(256, logoHeight256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 85 })
      .toFile(logo256Dest);
    
    const logo256Size = fs.statSync(logo256Dest).size;
    console.log(`LOGO-256.webp: 1071x1008 -> 256x${logoHeight256} | ${logo256Size} bytes`);
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

optimizeImages();
