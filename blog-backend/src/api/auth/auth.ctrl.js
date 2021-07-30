import Joi from 'joi';
import User from '../../models/user';

// 회원 가입
/**
 * POST /api/auth/register
 * {
 *  username: 'gyu',
 *  password: 'mypass123'
 * }
 */
export const register = async (ctx) => {
  // Request Body 검증
  const schema = Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(20).required(),
    password: Joi.string().required(),
  });

  const result = schema.validate(ctx.request.body);
  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }

  const { username, password } = ctx.request.body;
  try {
    // username이 이미 존재하는지 확인 - 존재하면 회원가입 수행 안함.
    const exists = await User.findByUsername(username);
    if (exists) {
      ctx.status = 409; // Conflict
      return;
    }

    const user = new User({ username });
    await user.setPassword(password); // 비밀번호 설정
    await user.save(); // DB 에 저장

    // 응답할 데이터에서 hashedPassword 필드 제거
    ctx.body = user.serialize();

    // jwt 토큰 쿠키로 전달
    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
      httpOnly: true,
    });
  } catch (error) {
    ctx.throw(500, error);
  }
};

// 로그인
/**
 * POST /api/auth/login
 * {
 *  username: 'gyu',
 *  password: 'mypass123'
 * }
 */
export const login = async (ctx) => {
  const { username, password } = ctx.request.body;

  // username, password 없으면 에러 처리
  if (!username || !password) {
    ctx.status = 401; // Unauthorized
    return;
  }

  try {
    const user = await User.findByUsername(username);
    if (!user) {
      ctx.status = 401;
      return;
    }
    const valid = await user.checkPassword(password);
    if (!valid) {
      ctx.status = 401;
      return;
    }
    ctx.body = user.serialize();

    // jwt 토큰 쿠키로 전달
    const token = user.generateToken();
    console.log('token', token);
    ctx.cookies.set('access_token', token, {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
      httpOnly: true,
    });
  } catch (error) {
    ctx.throw(500, error);
  }
};

// 로그인 상태 확인
export const check = async (ctx) => {};

// 로그아웃
export const logout = async (ctx) => {};
