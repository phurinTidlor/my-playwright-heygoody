/**
 * Test data fixtures
 *
 * ค่าทดสอบที่ใช้ซ้ำในหลาย test (email, phone, ฯลฯ)
 * แก้ที่ไฟล์นี้ที่เดียว ทุก spec ที่ import จะอัปเดตตาม
 */

const insured = {
    email: 'ptest.hg@gmail.com',
    phone: '0980356820',
};

const driver = {
    email: 'heygoody.test@gmail.com',
    phone: '0990000000',
    idCard: '3100900155331',
    license: '6000000001111',
    name: 'ระบุคนที่หนึ่ง',
    lastName: 'เฮกู้ดดี้',
};

const foreignDriver = {
    email: 'foreign.driver@heygoody.com',
    phone: '0980000001',
    passport: 'AB1234567',
    license: '6000000002222',
    name: 'John',
    lastName: 'Doe',
};

const address = {
    houseNo: '123/4',
    village: 'เดอะวิลล์ / Building 3',
    moo: '8',
    alley: 'สุขุมวิท 22',
    street: 'พระราม 4',
    zipcode: '10400',
};

const juristic = {
    companyName: 'บริษัท ทดสอบเฮกู้ดดี้ จำกัด',
    branch: '00',
};

module.exports = {
    insured,
    driver,
    foreignDriver,
    address,
    juristic,
};