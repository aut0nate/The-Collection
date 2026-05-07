import bcrypt from "bcryptjs";

const composeMode = process.argv[2] === "--compose";
const password = composeMode ? process.argv[3] : process.argv[2];

if (!password) {
  console.error("Usage: npm run password:hash -- [--compose] your-password");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
const escapedHash = composeMode ? `'${hash}'` : hash.replaceAll("$", "\\$");

console.log(`ADMIN_PASSWORD_HASH=${escapedHash}`);
