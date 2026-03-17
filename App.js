import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';
import { Calculator, TrendingUp, Info, AlertTriangle, RefreshCw, Database, ListOrdered, Target, Award } from 'lucide-react';

const App = () => {
  // 실제 평균 상태 관리
  const [actualMean, setActualMean] = useState('');
  
  // 고정 계급값 정의
  const FIXED_MIDPOINTS = {
    A: 95,
    B: 85,
    C: 75,
    D: 65
  };

  // 성취도별 데이터 상태 관리
  const [midpointE, setMidpointE] = useState('50');
  const [ratios, setRatios] = useState({
    A: '',
    B: '',
    C: '',
    D: '',
    E: '',
  });

  // 비율 변경 핸들러
  const handleRatioChange = (grade, value) => {
    setRatios(prev => ({
      ...prev,
      [grade]: value
    }));
  };

  // 초기화 함수
  const resetData = () => {
    setActualMean('');
    setMidpointE('50');
    setRatios({ A: '', B: '', C: '', D: '', E: '' });
  };

  // 핵심 계산 로직: 도수분포표 기반 평균 및 표준편차 산출
  const stats = useMemo(() => {
    const grades = ['A', 'B', 'C', 'D', 'E'];
    let totalRatio = 0;
    let weightedSum = 0;
    
    const validPoints = grades.map(g => {
      const midpoint = g === 'E' ? parseFloat(midpointE) : FIXED_MIDPOINTS[g];
      const ratio = parseFloat(ratios[g]);
      return { midpoint, ratio };
    }).filter(p => !isNaN(p.midpoint) && !isNaN(p.ratio));

    if (validPoints.length === 0) return null;

    validPoints.forEach(p => {
      totalRatio += p.ratio;
      weightedSum += (p.midpoint * p.ratio);
    });

    if (totalRatio === 0) return null;

    const calculatedWeightedMean = weightedSum / totalRatio;
    const inputMean = parseFloat(actualMean);
    const finalMean = !isNaN(inputMean) ? inputMean : calculatedWeightedMean;

    let sumOfSquares = 0;
    validPoints.forEach(p => {
      sumOfSquares += (p.ratio * Math.pow(p.midpoint - finalMean, 2));
    });
    
    const variance = sumOfSquares / totalRatio;
    const sd = Math.sqrt(variance);

    return {
      mean: finalMean.toFixed(2),
      isActualMean: !isNaN(inputMean),
      sd: sd.toFixed(2),
      variance: variance.toFixed(2),
      totalRatio: totalRatio.toFixed(1),
      interpretation: getInterpretation(sd)
    };
  }, [ratios, midpointE, actualMean]);

  // 변별력 해석 함수
  function getInterpretation(sd) {
    if (sd < 5) return {
      level: '매우 낮음 (변별력 한계)',
      desc: '학생 간 점수 차이가 거의 없어 실수 한 번으로 등급이 결정되는 구조입니다. 대입 변별력 확보가 시급한 상태입니다.',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    };
    if (sd < 12) return {
      level: '낮음 (평준화 분포)',
      desc: '평균 부근에 점수가 밀집되어 상위권 변별이 어렵습니다. 고난도 문항의 비중을 검토해볼 필요가 있습니다.',
      color: 'text-zinc-600',
      bgColor: 'bg-zinc-50',
      borderColor: 'border-zinc-200'
    };
    return {
      level: '보통 이상 (변별력 확보)',
      desc: '성취도가 고르게 분포되어 있어 대학 전형 지표로서 신뢰도가 높습니다. 적절한 실력 차이가 반영되고 있습니다.',
      color: 'text-zinc-900',
      bgColor: 'bg-emerald-50/20',
      borderColor: 'border-emerald-200'
    };
  }

  // 차트 시뮬레이션 데이터 생성
  const chartData = useMemo(() => {
    if (!stats) return [];
    const points = [];
    const m = parseFloat(stats.mean);
    const s = parseFloat(stats.sd);
    const range = Math.max(30, s * 4);
    
    for (let x = Math.max(0, m - range); x <= Math.min(100, m + range); x += 0.5) {
      const y = (1 / (s * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - m) / s, 2));
      points.push({ x: parseFloat(x.toFixed(1)), y: y });
    }
    return points;
  }, [stats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-zinc-100 p-4 md:p-8 font-sans text-zinc-900 selection:bg-red-100 selection:text-red-900">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 섹션 */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950 p-6 rounded-3xl shadow-xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 opacity-5 blur-3xl"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="bg-red-600 p-3 rounded-2xl shadow-lg shadow-red-900/40">
              <Award className="text-white" size={28} />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black tracking-tighter text-white uppercase">입시 데이터 마스터 <span className="text-red-600">분석 시스템</span></h1>
              <p className="text-zinc-400 text-sm font-bold mt-0.5 opacity-90 leading-tight">도수분포표 기반 정밀 표준편차 추정 솔루션</p>
            </div>
          </div>
          <button 
            onClick={resetData}
            className="flex items-center gap-2 px-6 py-2 bg-zinc-800 hover:bg-red-600 text-white rounded-xl text-xs font-black transition-all active:scale-95 border border-zinc-700 shadow-lg group relative z-10"
          >
            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-700" /> 데이터 초기화
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 입력 패널 */}
          <div className="lg:col-span-4 space-y-6 text-left">
            <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-200/60">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6 border-b border-zinc-100 pb-3">
                  <Target size={22} className="text-red-600" />
                  <h2 className="text-lg font-black uppercase tracking-widest text-zinc-900">기초 통계 기준</h2>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-zinc-200 transition-all focus-within:ring-2 focus-within:ring-red-100 focus-within:bg-white focus-within:border-red-600">
                  <label className="block text-xs font-black uppercase mb-2 text-zinc-500">실제 평균값 (μ)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.1"
                      placeholder="평균 입력"
                      className="w-full bg-transparent border-none outline-none font-black text-2xl text-zinc-900 placeholder:text-zinc-300 placeholder:font-medium"
                      value={actualMean}
                      onChange={(e) => setActualMean(e.target.value)}
                    />
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 font-black text-base text-zinc-400">점</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 border-b border-zinc-100 pb-3">
                <Database size={22} className="text-red-600" />
                <h2 className="text-lg font-black uppercase tracking-widest text-zinc-900">성취도별 분포</h2>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-3 px-2">
                  <div className="col-span-2 text-xs font-black text-zinc-400 uppercase">등급</div>
                  <div className="col-span-5 text-xs font-black text-zinc-400 uppercase text-center">계급값</div>
                  <div className="col-span-5 text-xs font-black text-zinc-400 uppercase text-center">비율 (%)</div>
                </div>

                {['A', 'B', 'C', 'D', 'E'].map((grade) => (
                  <div key={grade} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-2">
                      <div className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-base text-white shadow-sm ${
                        grade === 'A' ? 'bg-zinc-950' : 
                        grade === 'B' ? 'bg-zinc-800' : 
                        grade === 'C' ? 'bg-zinc-600' : 
                        grade === 'D' ? 'bg-zinc-400' : 'bg-red-600'
                      }`}>
                        {grade}
                      </div>
                    </div>
                    <div className="col-span-5">
                      {grade === 'E' ? (
                        <input 
                          type="number"
                          placeholder="계급값"
                          className="w-full p-3 bg-slate-50 border border-zinc-200 focus:border-red-600 focus:bg-white rounded-xl outline-none font-black text-center text-zinc-900"
                          value={midpointE}
                          onChange={(e) => setMidpointE(e.target.value)}
                        />
                      ) : (
                        <div className="w-full p-3 bg-slate-50 border border-zinc-100 rounded-xl font-black text-center text-zinc-300">
                          {FIXED_MIDPOINTS[grade]}
                        </div>
                      )}
                    </div>
                    <div className="col-span-5">
                      <div className="relative">
                        <input 
                          type="number"
                          placeholder="비율"
                          className="w-full p-3 bg-white border border-zinc-200 focus:border-red-600 rounded-xl outline-none font-black text-center text-red-600 shadow-sm"
                          value={ratios[grade]}
                          onChange={(e) => handleRatioChange(grade, e.target.value)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-300">%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 결과 패널 */}
          <div className="lg:col-span-8 space-y-6">
            {stats ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-950 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group text-left">
                    <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-1000 text-red-600">
                      <TrendingUp size={180} />
                    </div>
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">추정 표준편차 결과</p>
                    <div className="flex items-baseline gap-4 relative z-10">
                      <span className="text-7xl font-black text-white tracking-tighter leading-none">{stats.sd}</span>
                      <span className="text-3xl font-bold text-red-600 italic">σ</span>
                    </div>
                    <div className="mt-8 inline-flex items-center px-4 py-1.5 rounded-xl bg-red-600 border border-red-500 text-[10px] font-black text-white tracking-wide shadow-lg shadow-red-900/20">
                      <Target size={12} className="mr-2 text-white" />
                      {stats.isActualMean ? '확정' : '추정'} 평균 (μ): {stats.mean}
                    </div>
                  </div>

                  <div className={`bg-white p-8 rounded-[2rem] border-2 border-dashed ${stats.interpretation.borderColor} flex flex-col justify-center text-left shadow-lg relative overflow-hidden`}>
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${stats.interpretation.level.includes('확보') ? 'bg-zinc-900' : 'bg-red-600'}`}></div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 shadow-sm">
                        <AlertTriangle size={32} className={stats.interpretation.color} />
                      </div>
                      <h4 className={`text-2xl font-black text-zinc-900 tracking-tight`}>
                        {stats.interpretation.level}
                      </h4>
                    </div>
                    <p className="text-zinc-600 text-base leading-relaxed font-bold">
                      "{stats.interpretation.desc}"
                    </p>
                  </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl">
                  <div className="flex items-center justify-between mb-8 text-left">
                    <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-red-600 rounded-full"></div>
                      추정 정규분포 시뮬레이션
                    </h3>
                    <div className="flex gap-6 text-[10px] font-black text-zinc-400 uppercase">
                      <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-md"></div> 분포 밀도</span>
                      <span className="flex items-center gap-2"><div className="w-5 h-1 bg-zinc-950 rounded-full"></div> 평균 중심 (μ)</span>
                    </div>
                  </div>
                  
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="x" 
                          type="number" 
                          domain={[Math.max(0, parseFloat(stats.mean) - parseFloat(stats.sd) * 4), 100]} 
                          tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white text-zinc-900 p-4 rounded-2xl shadow-2xl text-xs border border-zinc-100 font-sans font-black">
                                  <p className="font-black border-b border-zinc-50 pb-2 mb-2 text-red-600 tracking-widest">{payload[0].payload.x} 점 구간</p>
                                  <p className="text-zinc-400">상대 밀도: {(payload[0].payload.y * 100).toFixed(4)}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="y" 
                          stroke="#dc2626" 
                          strokeWidth={4}
                          fillOpacity={1} 
                          fill="url(#colorRed)" 
                          animationDuration={2500}
                        />
                        <ReferenceLine x={parseFloat(stats.mean)} stroke="#09090b" strokeDasharray="4 4" strokeWidth={2} label={{ position: 'top', value: 'μ', fontSize: 14, fill: '#09090b', fontWeight: 900 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-[4rem] p-12 text-center group transition-all hover:border-red-600/30 shadow-inner">
                <div className="w-28 h-28 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-10 shadow-md group-hover:scale-105 transition-transform duration-700 border border-slate-100">
                  <ListOrdered className="text-zinc-300" size={60} />
                </div>
                <h3 className="text-3xl font-black text-zinc-300 tracking-tight italic uppercase">데이터 분석 대기 중</h3>
                <p className="text-zinc-400 text-lg max-w-sm mt-8 font-black leading-relaxed text-center">
                  평균값과 성취도 비율을 입력해 주세요. 입시 통계 엔진이 <span className="text-red-600 font-bold underline">라이트 프리미엄 환경</span>에서 정밀 분석을 수행합니다.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* 수정된 하단 푸터 영역: 글자 간격을 좁히고 정돈된 느낌 부여 */}
        <footer className="mt-12 text-center pb-8">
          <a 
            href="https://cafe.naver.com/ksatspecialist" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-red-600 transition-all duration-300 group"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 group-hover:scale-150 transition-transform"></div>
            <span className="text-xs font-black uppercase tracking-[0.1em]">김진만 입시스케치</span>
          </a>
        </footer>
      </div>
    </div>
  );
};

export default App;
