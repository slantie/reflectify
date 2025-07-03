const { execSync } = require('child_process');

try {
  execSync('prisma generate');
  console.log('Prisma Client generated successfully');
} catch (error) {
  console.error('Error generating Prisma Client:', error);
  process.exit(1);
}
