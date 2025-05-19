"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = void 0;
var mongoose_1 = require("mongoose");
var bcryptjs_1 = require("bcryptjs");
exports.UserSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    permissions: [{
            type: String,
            enum: [
                'read:blogs',
                'write:blogs',
                'read:wallpapers',
                'write:wallpapers',
                'read:users',
                'write:users',
                'read:orders',
                'write:orders',
                'manage:settings'
            ]
        }],
    isAdmin: {
        type: Boolean,
        default: false,
    },
    coins: {
        type: Number,
        default: 0,
        min: [0, 'Coin balance cannot be negative'],
    },
    avatar: String,
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: Date,
    inventory: {
        items: [{
                itemId: {
                    type: mongoose_1.Schema.Types.ObjectId,
                    ref: 'StoreItem',
                },
                acquiredAt: {
                    type: Date,
                    default: Date.now,
                },
                status: {
                    type: String,
                    enum: ['active', 'used', 'expired'],
                    default: 'active',
                },
            }],
        badges: [String],
        rewards: [String],
    },
}, {
    timestamps: true,
});
// Hash password before saving
exports.UserSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function () {
        var salt, _a, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!this.isModified('password'))
                        return [2 /*return*/, next()];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, bcryptjs_1.default.genSalt(10)];
                case 2:
                    salt = _b.sent();
                    _a = this;
                    return [4 /*yield*/, bcryptjs_1.default.hash(this.password, salt)];
                case 3:
                    _a.password = _b.sent();
                    next();
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _b.sent();
                    next(error_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
});
// Compare password method
exports.UserSchema.methods.comparePassword = function (candidatePassword) {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, bcryptjs_1.default.compare(candidatePassword, this.password)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_2 = _a.sent();
                    throw new Error('Password comparison failed');
                case 3: return [2 /*return*/];
            }
        });
    });
};
// Add coins method
exports.UserSchema.methods.addCoins = function (amount) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (amount < 0)
                        throw new Error('Amount must be positive');
                    this.coins += amount;
                    return [4 /*yield*/, this.save()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
};
// Deduct coins method
exports.UserSchema.methods.deductCoins = function (amount) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (amount < 0)
                        throw new Error('Amount must be positive');
                    if (this.coins < amount)
                        throw new Error('Insufficient coins');
                    this.coins -= amount;
                    return [4 /*yield*/, this.save()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
};
// Add method to check permissions
exports.UserSchema.methods.hasPermission = function (permission) {
    return this.permissions.includes(permission) || this.role === 'admin';
};
// Add indexes for efficient querying
exports.UserSchema.index({ email: 1 });
exports.UserSchema.index({ role: 1 });
exports.UserSchema.index({ coins: -1 });
exports.default = mongoose_1.default.models.User || mongoose_1.default.model('User', exports.UserSchema);
