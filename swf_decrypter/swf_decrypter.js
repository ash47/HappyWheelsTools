"use strict";

// Includes
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// The file to read
const inputStore = path.join(__dirname, 'flash');
const outputStore = path.join(__dirname, 'flash_decrypted');

// Ensures the given directory exists
function ensureFolderExists(folderPath) {
	try {
		fs.mkdirSync(folderPath);
	} catch(e) {
		// do nothing
	}
}

// Ensure input and output folders exist
ensureFolderExists(inputStore);
ensureFolderExists(outputStore);

const _Sbox = [
	0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
	0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
	0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
	0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
	0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
	0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
	0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
	0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
	0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
	0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
	0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
	0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
	0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
	0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
	0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
	0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
];

const _Rcon = [
	0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36
];

const _InvSbox = [
	0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
	0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
	0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
	0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
	0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
	0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84,
	0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06,
	0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b,
	0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73,
	0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e,
	0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b,
	0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4,
	0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
	0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef,
	0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61,
	0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d
];

const _XtimeE = [
	0x00, 0x0e, 0x1c, 0x12, 0x38, 0x36, 0x24, 0x2a, 0x70, 0x7e, 0x6c, 0x62, 0x48, 0x46, 0x54, 0x5a, 
	0xe0, 0xee, 0xfc, 0xf2, 0xd8, 0xd6, 0xc4, 0xca, 0x90, 0x9e, 0x8c, 0x82, 0xa8, 0xa6, 0xb4, 0xba, 
	0xdb, 0xd5, 0xc7, 0xc9, 0xe3, 0xed, 0xff, 0xf1, 0xab, 0xa5, 0xb7, 0xb9, 0x93, 0x9d, 0x8f, 0x81, 
	0x3b, 0x35, 0x27, 0x29, 0x03, 0x0d, 0x1f, 0x11, 0x4b, 0x45, 0x57, 0x59, 0x73, 0x7d, 0x6f, 0x61, 
	0xad, 0xa3, 0xb1, 0xbf, 0x95, 0x9b, 0x89, 0x87, 0xdd, 0xd3, 0xc1, 0xcf, 0xe5, 0xeb, 0xf9, 0xf7, 
	0x4d, 0x43, 0x51, 0x5f, 0x75, 0x7b, 0x69, 0x67, 0x3d, 0x33, 0x21, 0x2f, 0x05, 0x0b, 0x19, 0x17, 
	0x76, 0x78, 0x6a, 0x64, 0x4e, 0x40, 0x52, 0x5c, 0x06, 0x08, 0x1a, 0x14, 0x3e, 0x30, 0x22, 0x2c, 
	0x96, 0x98, 0x8a, 0x84, 0xae, 0xa0, 0xb2, 0xbc, 0xe6, 0xe8, 0xfa, 0xf4, 0xde, 0xd0, 0xc2, 0xcc, 
	0x41, 0x4f, 0x5d, 0x53, 0x79, 0x77, 0x65, 0x6b, 0x31, 0x3f, 0x2d, 0x23, 0x09, 0x07, 0x15, 0x1b, 
	0xa1, 0xaf, 0xbd, 0xb3, 0x99, 0x97, 0x85, 0x8b, 0xd1, 0xdf, 0xcd, 0xc3, 0xe9, 0xe7, 0xf5, 0xfb, 
	0x9a, 0x94, 0x86, 0x88, 0xa2, 0xac, 0xbe, 0xb0, 0xea, 0xe4, 0xf6, 0xf8, 0xd2, 0xdc, 0xce, 0xc0, 
	0x7a, 0x74, 0x66, 0x68, 0x42, 0x4c, 0x5e, 0x50, 0x0a, 0x04, 0x16, 0x18, 0x32, 0x3c, 0x2e, 0x20, 
	0xec, 0xe2, 0xf0, 0xfe, 0xd4, 0xda, 0xc8, 0xc6, 0x9c, 0x92, 0x80, 0x8e, 0xa4, 0xaa, 0xb8, 0xb6, 
	0x0c, 0x02, 0x10, 0x1e, 0x34, 0x3a, 0x28, 0x26, 0x7c, 0x72, 0x60, 0x6e, 0x44, 0x4a, 0x58, 0x56, 
	0x37, 0x39, 0x2b, 0x25, 0x0f, 0x01, 0x13, 0x1d, 0x47, 0x49, 0x5b, 0x55, 0x7f, 0x71, 0x63, 0x6d, 
	0xd7, 0xd9, 0xcb, 0xc5, 0xef, 0xe1, 0xf3, 0xfd, 0xa7, 0xa9, 0xbb, 0xb5, 0x9f, 0x91, 0x83, 0x8d
];

const _XtimeB = [
	0x00, 0x0b, 0x16, 0x1d, 0x2c, 0x27, 0x3a, 0x31, 0x58, 0x53, 0x4e, 0x45, 0x74, 0x7f, 0x62, 0x69, 
	0xb0, 0xbb, 0xa6, 0xad, 0x9c, 0x97, 0x8a, 0x81, 0xe8, 0xe3, 0xfe, 0xf5, 0xc4, 0xcf, 0xd2, 0xd9, 
	0x7b, 0x70, 0x6d, 0x66, 0x57, 0x5c, 0x41, 0x4a, 0x23, 0x28, 0x35, 0x3e, 0x0f, 0x04, 0x19, 0x12, 
	0xcb, 0xc0, 0xdd, 0xd6, 0xe7, 0xec, 0xf1, 0xfa, 0x93, 0x98, 0x85, 0x8e, 0xbf, 0xb4, 0xa9, 0xa2, 
	0xf6, 0xfd, 0xe0, 0xeb, 0xda, 0xd1, 0xcc, 0xc7, 0xae, 0xa5, 0xb8, 0xb3, 0x82, 0x89, 0x94, 0x9f, 
	0x46, 0x4d, 0x50, 0x5b, 0x6a, 0x61, 0x7c, 0x77, 0x1e, 0x15, 0x08, 0x03, 0x32, 0x39, 0x24, 0x2f, 
	0x8d, 0x86, 0x9b, 0x90, 0xa1, 0xaa, 0xb7, 0xbc, 0xd5, 0xde, 0xc3, 0xc8, 0xf9, 0xf2, 0xef, 0xe4, 
	0x3d, 0x36, 0x2b, 0x20, 0x11, 0x1a, 0x07, 0x0c, 0x65, 0x6e, 0x73, 0x78, 0x49, 0x42, 0x5f, 0x54, 
	0xf7, 0xfc, 0xe1, 0xea, 0xdb, 0xd0, 0xcd, 0xc6, 0xaf, 0xa4, 0xb9, 0xb2, 0x83, 0x88, 0x95, 0x9e, 
	0x47, 0x4c, 0x51, 0x5a, 0x6b, 0x60, 0x7d, 0x76, 0x1f, 0x14, 0x09, 0x02, 0x33, 0x38, 0x25, 0x2e, 
	0x8c, 0x87, 0x9a, 0x91, 0xa0, 0xab, 0xb6, 0xbd, 0xd4, 0xdf, 0xc2, 0xc9, 0xf8, 0xf3, 0xee, 0xe5, 
	0x3c, 0x37, 0x2a, 0x21, 0x10, 0x1b, 0x06, 0x0d, 0x64, 0x6f, 0x72, 0x79, 0x48, 0x43, 0x5e, 0x55, 
	0x01, 0x0a, 0x17, 0x1c, 0x2d, 0x26, 0x3b, 0x30, 0x59, 0x52, 0x4f, 0x44, 0x75, 0x7e, 0x63, 0x68, 
	0xb1, 0xba, 0xa7, 0xac, 0x9d, 0x96, 0x8b, 0x80, 0xe9, 0xe2, 0xff, 0xf4, 0xc5, 0xce, 0xd3, 0xd8, 
	0x7a, 0x71, 0x6c, 0x67, 0x56, 0x5d, 0x40, 0x4b, 0x22, 0x29, 0x34, 0x3f, 0x0e, 0x05, 0x18, 0x13, 
	0xca, 0xc1, 0xdc, 0xd7, 0xe6, 0xed, 0xf0, 0xfb, 0x92, 0x99, 0x84, 0x8f, 0xbe, 0xb5, 0xa8, 0xa3
];

const _XtimeD = [
	0x00, 0x0d, 0x1a, 0x17, 0x34, 0x39, 0x2e, 0x23, 0x68, 0x65, 0x72, 0x7f, 0x5c, 0x51, 0x46, 0x4b, 
	0xd0, 0xdd, 0xca, 0xc7, 0xe4, 0xe9, 0xfe, 0xf3, 0xb8, 0xb5, 0xa2, 0xaf, 0x8c, 0x81, 0x96, 0x9b, 
	0xbb, 0xb6, 0xa1, 0xac, 0x8f, 0x82, 0x95, 0x98, 0xd3, 0xde, 0xc9, 0xc4, 0xe7, 0xea, 0xfd, 0xf0, 
	0x6b, 0x66, 0x71, 0x7c, 0x5f, 0x52, 0x45, 0x48, 0x03, 0x0e, 0x19, 0x14, 0x37, 0x3a, 0x2d, 0x20, 
	0x6d, 0x60, 0x77, 0x7a, 0x59, 0x54, 0x43, 0x4e, 0x05, 0x08, 0x1f, 0x12, 0x31, 0x3c, 0x2b, 0x26, 
	0xbd, 0xb0, 0xa7, 0xaa, 0x89, 0x84, 0x93, 0x9e, 0xd5, 0xd8, 0xcf, 0xc2, 0xe1, 0xec, 0xfb, 0xf6, 
	0xd6, 0xdb, 0xcc, 0xc1, 0xe2, 0xef, 0xf8, 0xf5, 0xbe, 0xb3, 0xa4, 0xa9, 0x8a, 0x87, 0x90, 0x9d, 
	0x06, 0x0b, 0x1c, 0x11, 0x32, 0x3f, 0x28, 0x25, 0x6e, 0x63, 0x74, 0x79, 0x5a, 0x57, 0x40, 0x4d, 
	0xda, 0xd7, 0xc0, 0xcd, 0xee, 0xe3, 0xf4, 0xf9, 0xb2, 0xbf, 0xa8, 0xa5, 0x86, 0x8b, 0x9c, 0x91, 
	0x0a, 0x07, 0x10, 0x1d, 0x3e, 0x33, 0x24, 0x29, 0x62, 0x6f, 0x78, 0x75, 0x56, 0x5b, 0x4c, 0x41, 
	0x61, 0x6c, 0x7b, 0x76, 0x55, 0x58, 0x4f, 0x42, 0x09, 0x04, 0x13, 0x1e, 0x3d, 0x30, 0x27, 0x2a, 
	0xb1, 0xbc, 0xab, 0xa6, 0x85, 0x88, 0x9f, 0x92, 0xd9, 0xd4, 0xc3, 0xce, 0xed, 0xe0, 0xf7, 0xfa, 
	0xb7, 0xba, 0xad, 0xa0, 0x83, 0x8e, 0x99, 0x94, 0xdf, 0xd2, 0xc5, 0xc8, 0xeb, 0xe6, 0xf1, 0xfc, 
	0x67, 0x6a, 0x7d, 0x70, 0x53, 0x5e, 0x49, 0x44, 0x0f, 0x02, 0x15, 0x18, 0x3b, 0x36, 0x21, 0x2c, 
	0x0c, 0x01, 0x16, 0x1b, 0x38, 0x35, 0x22, 0x2f, 0x64, 0x69, 0x7e, 0x73, 0x50, 0x5d, 0x4a, 0x47, 
	0xdc, 0xd1, 0xc6, 0xcb, 0xe8, 0xe5, 0xf2, 0xff, 0xb4, 0xb9, 0xae, 0xa3, 0x80, 0x8d, 0x9a, 0x97
];

const _Xtime9 = [
	0x00, 0x09, 0x12, 0x1b, 0x24, 0x2d, 0x36, 0x3f, 0x48, 0x41, 0x5a, 0x53, 0x6c, 0x65, 0x7e, 0x77, 
	0x90, 0x99, 0x82, 0x8b, 0xb4, 0xbd, 0xa6, 0xaf, 0xd8, 0xd1, 0xca, 0xc3, 0xfc, 0xf5, 0xee, 0xe7, 
	0x3b, 0x32, 0x29, 0x20, 0x1f, 0x16, 0x0d, 0x04, 0x73, 0x7a, 0x61, 0x68, 0x57, 0x5e, 0x45, 0x4c, 
	0xab, 0xa2, 0xb9, 0xb0, 0x8f, 0x86, 0x9d, 0x94, 0xe3, 0xea, 0xf1, 0xf8, 0xc7, 0xce, 0xd5, 0xdc, 
	0x76, 0x7f, 0x64, 0x6d, 0x52, 0x5b, 0x40, 0x49, 0x3e, 0x37, 0x2c, 0x25, 0x1a, 0x13, 0x08, 0x01, 
	0xe6, 0xef, 0xf4, 0xfd, 0xc2, 0xcb, 0xd0, 0xd9, 0xae, 0xa7, 0xbc, 0xb5, 0x8a, 0x83, 0x98, 0x91, 
	0x4d, 0x44, 0x5f, 0x56, 0x69, 0x60, 0x7b, 0x72, 0x05, 0x0c, 0x17, 0x1e, 0x21, 0x28, 0x33, 0x3a, 
	0xdd, 0xd4, 0xcf, 0xc6, 0xf9, 0xf0, 0xeb, 0xe2, 0x95, 0x9c, 0x87, 0x8e, 0xb1, 0xb8, 0xa3, 0xaa, 
	0xec, 0xe5, 0xfe, 0xf7, 0xc8, 0xc1, 0xda, 0xd3, 0xa4, 0xad, 0xb6, 0xbf, 0x80, 0x89, 0x92, 0x9b, 
	0x7c, 0x75, 0x6e, 0x67, 0x58, 0x51, 0x4a, 0x43, 0x34, 0x3d, 0x26, 0x2f, 0x10, 0x19, 0x02, 0x0b, 
	0xd7, 0xde, 0xc5, 0xcc, 0xf3, 0xfa, 0xe1, 0xe8, 0x9f, 0x96, 0x8d, 0x84, 0xbb, 0xb2, 0xa9, 0xa0, 
	0x47, 0x4e, 0x55, 0x5c, 0x63, 0x6a, 0x71, 0x78, 0x0f, 0x06, 0x1d, 0x14, 0x2b, 0x22, 0x39, 0x30, 
	0x9a, 0x93, 0x88, 0x81, 0xbe, 0xb7, 0xac, 0xa5, 0xd2, 0xdb, 0xc0, 0xc9, 0xf6, 0xff, 0xe4, 0xed, 
	0x0a, 0x03, 0x18, 0x11, 0x2e, 0x27, 0x3c, 0x35, 0x42, 0x4b, 0x50, 0x59, 0x66, 0x6f, 0x74, 0x7d, 
	0xa1, 0xa8, 0xb3, 0xba, 0x85, 0x8c, 0x97, 0x9e, 0xe9, 0xe0, 0xfb, 0xf2, 0xcd, 0xc4, 0xdf, 0xd6, 
	0x31, 0x38, 0x23, 0x2a, 0x15, 0x1c, 0x07, 0x0e, 0x79, 0x70, 0x6b, 0x62, 0x5d, 0x54, 0x4f, 0x46
];

// AES Decryption BS
function AESKey(key) {
	this.state = [];
	this.keyLength = key.length;
	this.key = [];

	this.Nb = 4;

	for(var i=0; i< key.length; ++i) {
		this.key[i] = key[i];
	}

	this.Sbox = [];
	this.Rcon = [];
	this.InvSbox = [];

	this.XtimeB = [];
	this.XtimeD = [];
	this.XtimeE = [];
	this.Xtime9 = [];

	for(var i=0; i<_Sbox.length; ++i) {
		this.Sbox[i] = _Sbox[i];
	}

	for(var i=0; i<_Rcon.length; ++i) {
		this.Rcon[i] = _Rcon[i];
	}

	for(var i=0; i<_InvSbox.length; ++i) {
		this.InvSbox[i] = _InvSbox[i];
	}

	for(var i=0; i<_XtimeB.length; ++i) {
		this.XtimeB[i] = _XtimeB[i];
	}

	for(var i=0; i<_XtimeD.length; ++i) {
		this.XtimeD[i] = _XtimeD[i];
	}

	for(var i=0; i<_XtimeE.length; ++i) {
		this.XtimeE[i] = _XtimeE[i];
	}

	for(var i=0; i<_Xtime9.length; ++i) {
		this.Xtime9[i] = _Xtime9[i];
	}

	this.expandKey();
}

AESKey.prototype.expandKey = function() {
	var tmp0, tmp1, tmp2, tmp3, tmp4;

	var Nk = this.key.length / 4;
	this.Nr = Nk + 6;

	for(var idx = Nk; idx < this.Nb * (this.Nr + 1); idx++ ) {
		tmp0 = this.key[4*idx - 4];
		tmp1 = this.key[4*idx - 3];
		tmp2 = this.key[4*idx - 2];
		tmp3 = this.key[4*idx - 1];
		if( !(idx % Nk) ) {
		tmp4 = tmp3;
		tmp3 = this.Sbox[tmp0];
		tmp0 = this.Sbox[tmp1] ^ this.Rcon[idx/Nk];
		tmp1 = this.Sbox[tmp2];
		tmp2 = this.Sbox[tmp4];
		} else if( Nk > 6 && idx % Nk == 4 ) {
		tmp0 = this.Sbox[tmp0];
		tmp1 = this.Sbox[tmp1];
		tmp2 = this.Sbox[tmp2];
		tmp3 = this.Sbox[tmp3];
		}

		this.key[4*idx+0] = this.key[4*idx - 4*Nk + 0] ^ tmp0;
		this.key[4*idx+1] = this.key[4*idx - 4*Nk + 1] ^ tmp1;
		this.key[4*idx+2] = this.key[4*idx - 4*Nk + 2] ^ tmp2;
		this.key[4*idx+3] = this.key[4*idx - 4*Nk + 3] ^ tmp3;
	}
}

AESKey.prototype.addRoundKey = function(key, offset) {
	for(var idx = 0; idx < 16; idx++ ) {
		this.state[idx] ^= this.key[idx+offset];
	}
}

AESKey.prototype.invShiftRows = function() {
	var tmp;

	// restore row 0
	this.state[0] = this.InvSbox[this.state[0]]; this.state[4] = this.InvSbox[this.state[4]];
	this.state[8] = this.InvSbox[this.state[8]]; this.state[12] = this.InvSbox[this.state[12]];

	// restore row 1
	tmp = this.InvSbox[this.state[13]]; this.state[13] = this.InvSbox[this.state[9]];
	this.state[9] = this.InvSbox[this.state[5]]; this.state[5] = this.InvSbox[this.state[1]]; this.state[1] = tmp;

	// restore row 2
	tmp = this.InvSbox[this.state[2]]; this.state[2] = this.InvSbox[this.state[10]]; this.state[10] = tmp;
	tmp = this.InvSbox[this.state[6]]; this.state[6] = this.InvSbox[this.state[14]]; this.state[14] = tmp;

	// restore row 3
	tmp = this.InvSbox[this.state[3]]; this.state[3] = this.InvSbox[this.state[7]];
	this.state[7] = this.InvSbox[this.state[11]]; this.state[11] = this.InvSbox[this.state[15]]; this.state[15] = tmp;
}

AESKey.prototype.invMixSubColumns = function() {
	var tmp = [];

	// restore column 0
	tmp[0] = this.XtimeE[this.state[0]] ^ this.XtimeB[this.state[1]] ^ this.XtimeD[this.state[2]] ^ this.Xtime9[this.state[3]];
	tmp[5] = this.Xtime9[this.state[0]] ^ this.XtimeE[this.state[1]] ^ this.XtimeB[this.state[2]] ^ this.XtimeD[this.state[3]];
	tmp[10] = this.XtimeD[this.state[0]] ^ this.Xtime9[this.state[1]] ^ this.XtimeE[this.state[2]] ^ this.XtimeB[this.state[3]];
	tmp[15] = this.XtimeB[this.state[0]] ^ this.XtimeD[this.state[1]] ^ this.Xtime9[this.state[2]] ^ this.XtimeE[this.state[3]];

	// restore column 1
	tmp[4] = this.XtimeE[this.state[4]] ^ this.XtimeB[this.state[5]] ^ this.XtimeD[this.state[6]] ^ this.Xtime9[this.state[7]];
	tmp[9] = this.Xtime9[this.state[4]] ^ this.XtimeE[this.state[5]] ^ this.XtimeB[this.state[6]] ^ this.XtimeD[this.state[7]];
	tmp[14] = this.XtimeD[this.state[4]] ^ this.Xtime9[this.state[5]] ^ this.XtimeE[this.state[6]] ^ this.XtimeB[this.state[7]];
	tmp[3] = this.XtimeB[this.state[4]] ^ this.XtimeD[this.state[5]] ^ this.Xtime9[this.state[6]] ^ this.XtimeE[this.state[7]];

	// restore column 2
	tmp[8] = this.XtimeE[this.state[8]] ^ this.XtimeB[this.state[9]] ^ this.XtimeD[this.state[10]] ^ this.Xtime9[this.state[11]];
	tmp[13] = this.Xtime9[this.state[8]] ^ this.XtimeE[this.state[9]] ^ this.XtimeB[this.state[10]] ^ this.XtimeD[this.state[11]];
	tmp[2]  = this.XtimeD[this.state[8]] ^ this.Xtime9[this.state[9]] ^ this.XtimeE[this.state[10]] ^ this.XtimeB[this.state[11]];
	tmp[7]  = this.XtimeB[this.state[8]] ^ this.XtimeD[this.state[9]] ^ this.Xtime9[this.state[10]] ^ this.XtimeE[this.state[11]];

	// restore column 3
	tmp[12] = this.XtimeE[this.state[12]] ^ this.XtimeB[this.state[13]] ^ this.XtimeD[this.state[14]] ^ this.Xtime9[this.state[15]];
	tmp[1] = this.Xtime9[this.state[12]] ^ this.XtimeE[this.state[13]] ^ this.XtimeB[this.state[14]] ^ this.XtimeD[this.state[15]];
	tmp[6] = this.XtimeD[this.state[12]] ^ this.Xtime9[this.state[13]] ^ this.XtimeE[this.state[14]] ^ this.XtimeB[this.state[15]];
	tmp[11] = this.XtimeB[this.state[12]] ^ this.XtimeD[this.state[13]] ^ this.Xtime9[this.state[14]] ^ this.XtimeE[this.state[15]];

	for(var i=0; i < 4 * this.Nb; i++ ) {
		this.state[i] = this.InvSbox[tmp[i]];
	}
}

// 16 byte block to decrypt
AESKey.prototype.decrypt = function(block) {
	this.state = block;

	this.addRoundKey(this.key, this.Nr*this.Nb*4);
	this.invShiftRows();

	for(var round = this.Nr; round--; ) {
		this.addRoundKey( this.key, round*this.Nb*4);
		if (round) {
			this.invMixSubColumns();
		}
	}

	return this.state;
}

function decFile(fileName, callback) {
	// Grab vars
	var readFileName = path.join(inputStore, fileName);
	var writeFileName = path.join(outputStore, fileName);

	// Ensure the file actually exists
	fs.exists(readFileName, function(exists) {
		if(exists) {
			fs.readFile(readFileName, function(err, data) {
				if(err) {
					console.log('Had an error reading file: ' + fileName);
					console.log(err);
					if(callback) callback('Error reading file');
					return;
				}

				try {
					// The decryptor for the key
					const dec = crypto.createCipheriv(
						'aes-128-cbc',
						new Buffer('c5e04ea69c1fae8ba454f686ad7b1e00', 'hex'),	// Session variable from webpage is the key
						new Buffer('2bbc2791db69061378a1ef2cdf44a3fa', 'hex')	// Decompiled preloader to find the IV
					);

					// Push the data through the decrypter
					dec.update(new Buffer('93b7f60ddaa63cccce503b3c3d490b76', 'hex'));

					// Grab the decrypted result
					const theKeyBin = dec.final('hex');

					/*const decData = crypto.createCipher(
						'aes-256-ctr',
						new Buffer(AESKey, 'hex')	// Session variable from webpage is the key
					);*/

					var theKey = [];
					for(var i=0; i<theKeyBin.length; ++i) {
						theKey[i] = theKeyBin[i];
					}

					const myAESKey = new AESKey(theKey);

					// Weird values used for obfuscasion
					const maxLen = data.length & ~15;
					const bufferSize = 16;
					var posUpto = 0;

					//var tempBuffer = new Buffer(bufferSize);

					while(posUpto < maxLen) {
						// Read a block
						var readInto = [];
						for(var i=0; i<bufferSize; ++i) {
							readInto[i] = data[posUpto + i];
						}

						// Decrypt the block
						var decBlock = myAESKey.decrypt(readInto);

						// Put block back into data
						for(var i=0; i<bufferSize; ++i) {
							data[posUpto + i] = decBlock[i];
						}

						// Do a level of decryption
						//data.copy(tempBuffer, 0, posUpto, posUpto + maxLen);	// Read in maxLen bytes at position posUpto
						//var updatedDecrypted = decData.update(tempBuffer);

						// Copy the decrpyted data back into the original data array
						//updatedDecrypted.copy(data, posUpto, 0, maxLen);

						// Move to the next part
						posUpto += 16;
					}

					// Store the result
					fs.writeFile(writeFileName, data, function(err) {
						if(err) {
							console.log('Failed to write file: ' + fileName);
							console.log(err);
							if(callback) callback('Error writing file');
							return;
						}

						if(callback) callback();
					});
				} catch(e) {
					// Failed to decrypt
					console.log('Failed to decrypt file: ' + fileName);
					console.log(e);
					if(callback) callback('Error decrypting file');
					return;
				}

				
			});
		} else {
			console.log('Failed to find file: ' + fileName);
			if(callback) callback('Error finding file');
			return;
		}
	});
}

fs.readdir(inputStore, function(err, files) {
	if(err) {
		console.log('Error reading input store!');
		console.log(err);
		return;
	}

	var callbacksLeft = files.length;

	for(var i=0; i<files.length; ++i) {
		decFile(files[i], function() {
			if(--callbacksLeft <= 0) {
				console.log('Done!');
			}
		});
	}
});