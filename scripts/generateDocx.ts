import fs from 'fs';
import path from 'path';
import { Packer } from 'docx';
import { buildFinKitDocumentation } from '../src/utils/generateWordDoc';

async function main() {
  console.log('Generating FinKit by Byteframe Feature Documentation (.docx)...');
  
  const doc = buildFinKitDocumentation();
  const buffer = await Packer.toBuffer(doc);
  
  // 1. Save to root directory
  const rootFilePath = path.resolve(process.cwd(), 'FinKit_by_Byteframe_Feature_Documentation.docx');
  fs.writeFileSync(rootFilePath, buffer);
  console.log(`Saved document to root: ${rootFilePath}`);

  // 2. Ensure public directory exists and save to public directory
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicFilePath = path.join(publicDir, 'FinKit_by_Byteframe_Feature_Documentation.docx');
  fs.writeFileSync(publicFilePath, buffer);
  console.log(`Saved document to public: ${publicFilePath}`);

  console.log(`Success! File size: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error('Error generating docx file:', err);
  process.exit(1);
});
