const { handler } = require('../src/video-token-server');
const jwt = require('jsonwebtoken');

const callback = jest.fn();

const mockContext = {
  ACCOUNT_SID: 'AC1234',
  TWILIO_API_KEY_SID: 'SK1234',
  TWILIO_API_KEY_SECRET: '123456',
  API_PASSCODE: '123456',
  API_PASSCODE_EXPIRY: '10',
  DOMAIN_NAME: 'video-app-6789-dev.twil.io',
};

describe('the video-token-server', () => {
  it('should return an "unauthorized" error when the room_name is not on whitelist', () => {
    Date.now = () => 5;

    handler(mockContext, { passcode: '9876543210', user_identity: 'test identity', room_name: 'notOnTheList' }, callback);

    expect(callback).toHaveBeenCalledWith(null, {
      body: {
        error: {
          message: 'room_name incorrect',
          explanation: 'The room_name submitted is incorrect.',
        },
      },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 401,
    });
  });

  it('should return an "unauthorized" error when the room_name is not submitted', () => {
    Date.now = () => 5;

    handler(mockContext, { passcode: '9876543210', user_identity: 'test identity' }, callback);

    expect(callback).toHaveBeenCalledWith(null, {
      body: {
        error: {
          message: 'room_name incorrect',
          explanation: 'The room_name submitted is incorrect.',
        },
      },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 401,
    });
  });

  it('should return an "unauthorized" error when the passcode is not submitted', () => {
    Date.now = () => 5;

    handler(mockContext, { room_name: 'brent', user_identity: 'test identity' }, callback);

    expect(callback).toHaveBeenCalledWith(null, {
      body: {
        error: {
          message: 'passcode incorrect',
          explanation: 'The passcode used to access this room_name is incorrect.',
        },
      },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 401,
    });
  });

  it('should return an "unauthorized" error when the passcode is incorrect', () => {
    Date.now = () => 5;

    handler(mockContext, { room_name: 'brent', passcode: 'notCorrect', user_identity: 'test identity' }, callback);

    expect(callback).toHaveBeenCalledWith(null, {
      body: {
        error: {
          message: 'passcode incorrect',
          explanation: 'The passcode used to access this room_name is incorrect.',
        },
      },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 401,
    });
  });

  it('should return a "missing user_identity" error when the "user_identity" parameter is not supplied', () => {
    Date.now = () => 5;

    handler(mockContext, { room_name: 'brent', passcode: 'eb3ed78b2bb6a0ca2491df488f4cd632' }, callback);

    expect(callback).toHaveBeenCalledWith(null, {
      body: {
        error: {
          message: 'missing user_identity',
          explanation:
            'The user_identity parameter is missing.',
        },
      },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 400,
    });
  });

  // I've left this in because I have a feeling making room_name mandatory
  // may break the client code.
  // I've deactivated it because it is not a valid test.
  xit('should return a token when no room_name is supplied', () => {
    Date.now = () => 5;

    handler(mockContext, { passcode: '1234566789',  user_identity: 'test identity' }, callback);

    expect(callback).toHaveBeenCalledWith(null, {
      body: { token: expect.any(String) },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 200,
    });

    expect(jwt.decode(callback.mock.calls[0][1].body.token)).toEqual({
      exp: 14400,
      grants: {
        identity: "test identity",
        video: {},
      },
      iat: 0,
      iss: 'SK1234',
      jti: 'SK1234-0',
      sub: 'AC1234',
    });
  });

  it('should return a valid token when whitelisted room_name with matching passcode plus a user_identity are supplied', () => {
    Date.now = () => 5;
    handler(mockContext, { passcode: 'eb3ed78b2bb6a0ca2491df488f4cd632', room_name: 'brent', user_identity: 'test-user' }, callback);

    expect(callback).toHaveBeenCalledWith(null, {
      body: { token: expect.any(String) },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 200,
    });

    expect(jwt.decode(callback.mock.calls[0][1].body.token)).toEqual({
      exp: 14400,
      grants: {
        identity: 'test-user',
        video: {
          room: 'brent',
        },
      },
      iat: 0,
      iss: 'SK1234',
      jti: 'SK1234-0',
      sub: 'AC1234',
    });
  });
});
