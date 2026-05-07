import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run password:hash -- your-password");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
const escapedHash = hash.replaceAll("$", "\\$");

console.log(`ADMIN_PASSWORD_HASH=${escapedHash}`);
