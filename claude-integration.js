// Claude API 실시간 요약

const CLAUDE_API_KEY = 'sk-ant-v1-placeholder'; // .env에서 로드되어야 함

/**
 * Claude API로 지원사업 요약
 */
async function generateAISummary(programs) {
  if (!CLAUDE_API_KEY || CLAUDE_API_KEY.includes('placeholder')) {
    return generateMockSummary(programs);
  }

  try {
    const prompt = `다음 지원사업 중 가장 추천할 만한 3개를 선택하고, 각각을 한 문장으로 요약해주세요.

${programs.map(p => `- ${p.title}: ${p.desc}`).join('\n')}

형식: "프로그램명: 요약내용"`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.content[0]?.text || generateMockSummary(programs);
    }

    return generateMockSummary(programs);
  } catch (error) {
    console.error('Claude API 호출 실패:', error);
    return generateMockSummary(programs);
  }
}

/**
 * Mock AI 요약
 */
function generateMockSummary(programs) {
  const summaries = {
    '초기창업': '예비창업자 대상 최대 1억원 자금 + 경영컨설팅 지원. 4월 15일 마감.',
    '성장': '3년 이내 성장기업 대상 사업확대 및 기술고도화 자금. 4월 20일 마감.',
    '여성': '여성 사업주 대상 최대 5천만원 + 전문 교육프로그램. 4월 10일 마감.',
  };

  let result = '';
  for (const target in summaries) {
    const matching = programs.find(p => p.target.includes(target));
    if (matching) {
      result += `\n<strong>${matching.title}</strong><br>${summaries[target]}`;
    }
  }

  return result || '다양한 지원사업이 준비되어 있습니다. 지역과 대상을 필터링해보세요.';
}

/**
 * 마감 임박 알림 계산
 */
function getDeadlineUrgency(deadline) {
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const daysLeft = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) return { urgency: 'closed', label: '마감됨', color: '#999' };
  if (daysLeft <= 3) return { urgency: 'critical', label: `${daysLeft}일 남음 🚨`, color: '#d32f2f' };
  if (daysLeft <= 7) return { urgency: 'warning', label: `${daysLeft}일 남음 ⚠️`, color: '#f57c00' };
  return { urgency: 'normal', label: `${daysLeft}일 남음`, color: '#666' };
}

/**
 * 사용자 맞춤 추천
 */
function getPersonalizedRecommendations(userProfile, programs) {
  // 간단한 규칙 기반 추천
  const recommendations = programs.map(p => {
    let score = 0;
    
    // 지역 매칭 (+30)
    if (p.region === userProfile.region || p.region === '전국') score += 30;
    
    // 대상 매칭 (+40)
    if (p.target === userProfile.stage) score += 40;
    
    // 마감 여유 (+20, 7일 이상)
    const days = getDeadlineUrgency(p.deadline).urgency === 'normal' ? 20 : 0;
    score += days;
    
    return { ...p, score };
  });

  return recommendations.sort((a, b) => b.score - a.score).slice(0, 3);
}
