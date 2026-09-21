import { body } from 'express-validator';

export const createUserValidation = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Full name is required and must be between 2 and 150 characters.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required.')
    .normalizeEmail(),
  body('roleName')
    .trim()
    .notEmpty()
    .withMessage('Role name is required.'),
  body('password')
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 10 })
    .withMessage('Password must be at least 10 characters if provided.'),
  body('employeeId')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Employee ID cannot exceed 50 characters.'),
  body('designation')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Designation cannot exceed 50 characters.'),
  body('employeeType')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Employee type cannot exceed 50 characters.'),
  body('salesRole')
    .optional({ nullable: true })
    .trim()
    .isIn(['SO', 'TSM', 'ASM', 'RSM', 'NON_SALES', ''])
    .withMessage('Sales role must be one of: SO, TSM, ASM, RSM, NON_SALES.'),
  body('departmentId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Department ID must be a valid UUID.'),
  body('regionId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Region ID must be a valid UUID.'),
  body('areaId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Area ID must be a valid UUID.'),
  body('territoryId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Territory ID must be a valid UUID.'),
];

export const updateUserValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Full name must be between 2 and 150 characters.'),
  body('roleName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Role name cannot be empty.'),
  body('designation')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Designation cannot exceed 50 characters.'),
  body('employeeType')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Employee type cannot exceed 50 characters.'),
  body('salesRole')
    .optional({ nullable: true })
    .trim()
    .isIn(['SO', 'TSM', 'ASM', 'RSM', 'NON_SALES', ''])
    .withMessage('Sales role must be one of: SO, TSM, ASM, RSM, NON_SALES.'),
  body('departmentId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Department ID must be a valid UUID.'),
  body('regionId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Region ID must be a valid UUID.'),
  body('areaId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Area ID must be a valid UUID.'),
  body('territoryId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Territory ID must be a valid UUID.'),
];
