'use strict';
var LTI = (mode, event, context, callback) => {
  let cf_url = process.env.CF_URL;
  let lambda_url = event.headers.Host;
  let stage = process.env.stage;
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
    <cartridge_basiclti_link xmlns="http://www.imsglobal.org/xsd/imslticc_v1p0"
        xmlns:blti = "http://www.imsglobal.org/xsd/imsbasiclti_v1p0"
        xmlns:lticm ="http://www.imsglobal.org/xsd/imslticm_v1p0"
        xmlns:lticp ="http://www.imsglobal.org/xsd/imslticp_v1p0"
        xmlns:xsi = "http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation = "http://www.imsglobal.org/xsd/imslticc_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticc_v1p0.xsd
        http://www.imsglobal.org/xsd/imsbasiclti_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imsbasiclti_v1p0.xsd
        http://www.imsglobal.org/xsd/imslticm_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticm_v1p0.xsd
        http://www.imsglobal.org/xsd/imslticp_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticp_v1p0.xsd">
        <blti:title>${mode.title}</blti:title>
        <blti:description>${mode.description}</blti:description>
        <blti:icon>https://${cf_url}/discussionHero/static/DHFlat.png</blti:icon>
        <blti:custom>
          ${mode.custom}
        </blti:custom>
        <blti:launch_url>https://${lambda_url}/${stage}/consumeLTI</blti:launch_url>
        <blti:extensions platform="canvas.instructure.com">
          <lticm:property name="tool_id">dh1</lticm:property>
          <lticm:property name="privacy_level">public</lticm:property>
          <lticm:options name="course_navigation">
            <lticm:property name="url">https://${lambda_url}/${stage}/consumeLTI</lticm:property>
            <lticm:property name="text">${mode.title}</lticm:property>
            <lticm:property name="visibility">public</lticm:property>
            <lticm:property name="default">enabled</lticm:property>
            <lticm:property name="enabled">true</lticm:property>
          </lticm:options>
        </blti:extensions>
        <cartridge_bundle identifierref="BLTI001_Bundle"/>
        <cartridge_icon identifierref="BLTI001_Icon"/>
    </cartridge_basiclti_link>`
  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml'
    },
    body: xml
  };
  callback(null, response);
};
var DH = (event, context, callback) => {
  LTI({
    param: '',
    title: 'Discussion Hero',
    description: 'A Heroic interface for Canvas discussion forums.',
    custom: ''
  }, event, context, callback)
}
var N2 = (event, context, callback) => {
  LTI({
    param: 'mode=nebula',
    title: 'Nebula 2',
    description: 'A network graph interface for Canvas discussion forums.',
    custom: '<lticm:property name="mode">nebula</lticm:property>'
  }, event, context, callback)
}
module.exports = {
  LTI: LTI,
  DH: DH,
  N2: N2
};