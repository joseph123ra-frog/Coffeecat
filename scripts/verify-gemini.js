import { generate, groundedSources, responseText } from '../src/gemini.js';

let stage = '기본 생성';
try {
  const result = await generate({
    contents: [{ role: 'user', parts: [{ text: '다음 글자 하나만 답하세요: 확인' }] }],
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0,
    },
  });

  if (!responseText(result).includes('확인')) throw new Error('Gemini 응답 확인 실패');

  stage = 'Google 검색';
  const searchResult = await generate({
    contents: [{ role: 'user', parts: [{ text: '오늘 날짜를 웹에서 확인하고 근거가 있는 한 문장으로 답하세요.' }] }],
    tools: [{ google_search: {} }],
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0,
    },
  });
  responseText(searchResult);
  if (groundedSources(searchResult).size === 0) throw new Error('Google 검색 근거 확인 실패');
  console.log('Gemini 무료 프로젝트 키 연결 확인 완료');
} catch (error) {
  let detail = `${stage}: ${error.message}`;
  if (detail.includes('HTTP 404') && process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', {
        headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
      });
      const data = await response.json();
      const models = (data.models || [])
        .filter(model => model.supportedGenerationMethods?.includes('generateContent'))
        .map(model => model.name?.replace(/^models\//, ''))
        .filter(name => name?.includes('flash'))
        .slice(0, 20);
      if (models.length) detail += ` 사용 가능 Flash 모델: ${models.join(', ')}`;
    } catch { /* 진단 목록을 못 읽어도 원래 오류를 유지한다. */ }
  }
  console.error(`::error title=Gemini 연결 실패::${detail}`);
  process.exitCode = 1;
}
