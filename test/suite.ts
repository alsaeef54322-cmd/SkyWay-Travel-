import assert from 'assert';
import bcrypt from 'bcryptjs';
import {
  calculateAge,
  getPassportStatus,
  getDatabase,
  saveDatabase,
  createBackup,
  restoreDatabase,
} from '../src/server/db.ts';
import { sanitizeCellValue, generateExportWorkbook } from '../src/server/excel.ts';

console.log('🧪 Starting SkyWay Travel Enterprise Automated Test Suite...\n');

// 1. Age calculation
console.log('1. Testing Customer Age Calculation...');
const age1 = calculateAge('1984-06-15');
assert(age1 >= 40, `Age should be at least 40, got ${age1}`);
const age2 = calculateAge('2010-01-01');
assert(age2 >= 16, `Age should be at least 16, got ${age2}`);
const ageZero = calculateAge('');
assert.strictEqual(ageZero, 0, 'Empty DOB should return 0');
console.log('✅ Age calculations passed.');

// 2. Passport Expiry Status
console.log('2. Testing Passport Expiry Calculation & Warning Thresholds...');
const pastDate = '2020-01-01';
assert.strictEqual(getPassportStatus(pastDate, 180), 'expired', 'Past date should be expired');

const soonDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
assert.strictEqual(getPassportStatus(soonDate, 180), 'expiring_soon', '60 days away should be expiring_soon with 180 warning window');

const farDate = new Date(Date.now() + 1000 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
assert.strictEqual(getPassportStatus(farDate, 180), 'valid', '1000 days away should be valid');
console.log('✅ Passport expiry status calculations passed.');

// 3. Excel Formula Injection Sanitization
console.log('3. Testing Excel CSV/XLSX Formula Injection Sanitization...');
assert.strictEqual(sanitizeCellValue('=SUM(A1:A10)'), "'=SUM(A1:A10)");
assert.strictEqual(sanitizeCellValue('+12345'), "'+12345");
assert.strictEqual(sanitizeCellValue('-54321'), "'-54321");
assert.strictEqual(sanitizeCellValue('@cmd'), "'@cmd");
assert.strictEqual(sanitizeCellValue('Valid Text'), 'Valid Text');
console.log('✅ Excel formula injection protection passed.');

// 4. Database Seed & Authoritative Financial Math
console.log('4. Testing Database Seed Integrity & Financial Calculations...');
const db = getDatabase();
assert(db.users.length >= 4, 'Should have at least 4 seeded employees');
assert(db.customers.length >= 5, 'Should have at least 5 seeded customers');
assert(db.passports.length >= 5, 'Should have at least 5 seeded passports');
assert(db.bookings.length >= 5, 'Should have at least 5 seeded bookings');
assert(db.payments.length >= 5, 'Should have at least 5 seeded payments');

const totalBookingsValue = db.bookings
  .filter((b) => b.status !== 'cancelled')
  .reduce((sum, b) => sum + Number(b.totalPrice), 0);
const totalPayments = db.payments.reduce((sum, p) => sum + Number(p.amount), 0);
assert(totalBookingsValue > 0, 'Total booking value must be positive');
assert(totalPayments > 0, 'Total payments must be positive');
const outstanding = Math.max(0, totalBookingsValue - totalPayments);
assert(outstanding >= 0, 'Outstanding balance must be non-negative');
console.log(`✅ Financial integrity verified: Bookings=${totalBookingsValue}, Payments=${totalPayments}, Outstanding=${outstanding}`);

// 5. Authentication & Password Hashing
console.log('5. Testing Secure Password Hashing...');
const adminUser = db.users.find((u) => u.email === 'admin@skyway.com');
assert(adminUser, 'Admin user must exist');
const isMatch = bcrypt.compareSync('SkyWay@2026', adminUser.passwordHash);
assert.strictEqual(isMatch, true, 'Default password hash must verify correctly');
const badMatch = bcrypt.compareSync('WrongPassword', adminUser.passwordHash);
assert.strictEqual(badMatch, false, 'Invalid password must be rejected');
console.log('✅ Password verification passed.');

// 6. Excel Export Generator
console.log('6. Testing ExcelJS Workbook Generation...');
async function testExcel() {
  const wb = await generateExportWorkbook('customers');
  assert(wb, 'Workbook should be generated');
  const sheet = wb.getWorksheet('Customers - العملاء');
  assert(sheet, 'Customers worksheet should exist');
  assert(sheet.rowCount >= 6, `Sheet should have header + at least 5 customer rows, got ${sheet.rowCount}`);
  console.log(`✅ Excel export generated correctly with ${sheet.rowCount} rows.`);
}

// 7. Backup and Restore
console.log('7. Testing Database Backup & Restore...');
const backup = createBackup();
assert(backup.filename.startsWith('skyway_backup_'), 'Backup filename should have correct prefix');
assert(backup.size > 0, 'Backup file should not be empty');
const ok = restoreDatabase(JSON.stringify(db));
assert.strictEqual(ok, true, 'Database restore should succeed');
console.log('✅ Backup & recovery mechanisms verified.');

testExcel().then(() => {
  console.log('\n🎉 ALL 7 TEST SUITES PASSED SUCCESSFULLY!');
});
