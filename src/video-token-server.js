/* global Twilio */
'use strict';

const AccessToken = Twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const MAX_ALLOWED_SESSION_DURATION = 14400;

const ROOM_WHITELIST_PASSCODES = {
  dev: '92cd6c0cdd0b323ab88329e9f12cb17c',
  staging: '9a6db12a137c7f51c5dc7127aab6defc',
  prod: 'cdd021c453d076ecf6d2234d6851d4e1',
  jesse: 'a500fb1d401a0de1e10a238249e9620a',
  wyatt: '1b4764c939a00359a88c22c35809e640',
  brent: 'eb3ed78b2bb6a0ca2491df488f4cd632',
  lolo: 'cb685cf0b9c635cf2e49cc0ab96bb8c0',
  chris: 'ccc6d607f1adbab4adb59efe047a2f4e',
  darren: 'fc8b7ba4645dedbd5a118e56525bc648',
  julia: '47ed9e60bbe845283bc2fe37aa55bf45',
  elle: '33167f62cc63e2f2dd08d97f2baaf052',
};

module.exports.handler = (context, event, callback) => {
  const {
    ACCOUNT_SID,
    TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET,
    // API_PASSCODE,
    // API_PASSCODE_EXPIRY,
    // DOMAIN_NAME,
  } = context;

  const { user_identity, room_name, passcode } = event;
  // const appID = DOMAIN_NAME.match(/-(\d+)(?:-\w+)?.twil.io$/)[1];

  let response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');

  //
  // Disabling all passcode protection. This is the passcode that guards the
  // entire application. That functionality makes no sense for our needs. We
  // will have a room by room passcode. So, I'm deactivating it all. I'm leaving
  // it in place so we have a reference for how to interact with Twilio's
  // serverless infra without having to reverse engineer everything from their
  // docs.
  //
  // if (Date.now() > API_PASSCODE_EXPIRY) {
  //   response.setStatusCode(401);
  //   response.setBody({
  //     error: {
  //       message: 'passcode expired',
  //       explanation:
  //         'The passcode used to validate application users has expired. Re-deploy the application to refresh the passcode.',
  //     },
  //   });
  //   callback(null, response);
  //   return;
  // }

  // if (API_PASSCODE + appID !== passcode) {
  //   response.setStatusCode(401);
  //   response.setBody({
  //     error: {
  //       message: 'passcode incorrect',
  //       explanation: 'The passcode used to validate application users is incorrect.',
  //     },
  //   });
  //   callback(null, response);
  //   return;
  // }

  if (!room_name || !room_name.length || !ROOM_WHITELIST_PASSCODES[room_name]) {
    response.setStatusCode(401);
    response.setBody({
      error: {
        message: 'room_name incorrect',
        explanation: 'The room_name submitted is incorrect.',
      },
    });
    callback(null, response);
    return;
  }

  if (!passcode || !passcode.length || ROOM_WHITELIST_PASSCODES[room_name] !== passcode) {
    response.setStatusCode(401);
    response.setBody({
      error: {
        message: 'passcode incorrect',
        explanation: 'The passcode used to access this room_name is incorrect.',
      },
    });
    callback(null, response);
    return;
  }

  if (!user_identity) {
    response.setStatusCode(400);
    response.setBody({
      error: {
        message: 'missing user_identity',
        explanation: 'The user_identity parameter is missing.',
      },
    });
    callback(null, response);
    return;
  }

  const token = new AccessToken(ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, {
    ttl: MAX_ALLOWED_SESSION_DURATION,
  });
  token.identity = user_identity;
  const videoGrant = new VideoGrant({ room: room_name });
  token.addGrant(videoGrant);
  response.setStatusCode(200);
  response.setBody({ token: token.toJwt() });
  callback(null, response);
};
