import { USER_REPOSITORY } from '#repositories/userRepository.js'
import { ERROR_CODES } from '#constants/errorCode.js'
import ApiError from '#utils/ApiError.js'
import { RoleEnum } from '#constants/userConstant.js'
import { VERIFY_TYPE } from '#constants/verificationConstant.js'
import { VERIFICATION_REPOSITORY } from '#repositories/verificationRepository.js'
import { GENERATE_UTILS } from '#utils/generateUtil.js'
import { EMAIL_SERVICE } from '#services/emailService.js'

const registerUser = async (userData, requestInfo = {}) => {
  const { ipAddress = '', userAgent = '' } = requestInfo

  if (!userData.email) throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Email là bắt buộc'])
  const existingUser = await USER_REPOSITORY.getUserByEmail(userData.email)
  if (existingUser) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, ['Email đã được sử dụng'])
  }
  const newUser = await USER_REPOSITORY.createUser({
    ...userData,
    role: RoleEnum.CUSTOMER
  })

  await VERIFICATION_REPOSITORY.deleteVerificationCodesByUserId(newUser._id, VERIFY_TYPE.REGISTER)
  const code = GENERATE_UTILS.generateVerificationCode()
  await VERIFICATION_REPOSITORY.createVerificationCode({
    userId: newUser._id,
    type: VERIFY_TYPE.REGISTER,
    code,
    ipAddress,
    userAgent
  })

  await EMAIL_SERVICE.sendVerificationCode(userData.email, code, VERIFY_TYPE.REGISTER, GENERATE_UTILS.OTP_EXPIRES_IN_MINUTES)

  return {
    user: newUser,
    message: 'Đăng ký thành công. Vui lòng kiểm tra email của bạn để lấy mã xác thực.'
  }
}

export const AUTH_SERVICE = {
  registerUser
}