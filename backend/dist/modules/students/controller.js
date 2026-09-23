"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listStudents = listStudents;
exports.getStudent = getStudent;
exports.me = me;
exports.updateMe = updateMe;
const studentService = __importStar(require("./service"));
async function listStudents(req, res) {
    const result = await studentService.listStudents(req.query);
    res.status(200).json(result);
}
async function getStudent(req, res) {
    const student = await studentService.getStudent(req.params.id);
    res.status(200).json(student);
}
async function me(req, res) {
    const student = await studentService.getMyStudentProfile(req.auth.userId);
    res.status(200).json(student);
}
async function updateMe(req, res) {
    const student = await studentService.updateMyStudentProfile(req.auth.userId, req.body);
    res.status(200).json(student);
}
