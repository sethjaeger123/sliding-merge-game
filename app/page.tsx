"use client";

import { useCallback, useEffect, useRef, useState } from "react";
type Direction = "left" | "right" | "up" | "down";
const SIZE = 5;
const ITEMS = [{emoji:"🍒",name:"Cherry"},{emoji:"🍋",name:"Lemon"},{emoji:"🍩",name:"Donut"},{emoji:"🍔",name:"Burger"},{emoji:"🧋",name:"Boba"},{emoji:"🍰",name:"Cake"},{emoji:"🍹",name:"Tropical"},{emoji:"👑",name:"Royal Feast"}];
const emptyBoard = () => Array<number>(SIZE * SIZE).fill(0);

function addRandom(board: number[]) {
  const open = board.map((v, i) => v === 0 ? i : -1).filter(i => i >= 0);
  if (!open.length) return board;
  const next = [...board];
  next[open[Math.floor(Math.random() * open.length)]] = Math.random() < .88 ? 1 : 2;
  return next;
}
const freshBoard = () => addRandom(addRandom(emptyBoard()));
function mergeLine(line: number[]) {
  const compact = line.filter(Boolean), merged: number[] = [];
  let points = 0;
  for (let i = 0; i < compact.length; i++) {
    if (compact[i] === compact[i + 1]) { const value = compact[i] + 1; merged.push(value); points += 2 ** value; i++; }
    else merged.push(compact[i]);
  }
  return { line: [...merged, ...Array(SIZE - merged.length).fill(0)], points };
}
function moveBoard(board: number[], direction: Direction) {
  const next = emptyBoard(); let points = 0;
  for (let outer = 0; outer < SIZE; outer++) {
    const indices = Array.from({length:SIZE}, (_, inner) => direction === "left" || direction === "right" ? outer * SIZE + inner : inner * SIZE + outer);
    if (direction === "right" || direction === "down") indices.reverse();
    const result = mergeLine(indices.map(i => board[i])); points += result.points;
    indices.forEach((index, position) => { next[index] = result.line[position]; });
  }
  const changed = next.some((v, i) => v !== board[i]);
  return { board: changed ? addRandom(next) : board, points, changed };
}
function hasMoves(board: number[]) {
  if (board.includes(0)) return true;
  return board.some((v, i) => { const x=i%SIZE, y=Math.floor(i/SIZE); return (x<SIZE-1&&v===board[i+1])||(y<SIZE-1&&v===board[i+SIZE]); });
}

export default function Home() {
  const [board,setBoard]=useState<number[]>(freshBoard), [score,setScore]=useState(0), [best,setBest]=useState(0), [gameOver,setGameOver]=useState(false), [newBest,setNewBest]=useState(false);
  const touchStart=useRef<{x:number;y:number}|null>(null);
  useEffect(()=>{ setBest(Number(localStorage.getItem("snack-stack-best")||0)); },[]);
  const move=useCallback((direction:Direction)=>{
    if(gameOver)return;
    setBoard(current=>{ const result=moveBoard(current,direction); if(!result.changed)return current;
      setScore(old=>{ const total=old+result.points; setBest(oldBest=>{ const next=Math.max(oldBest,total); if(next>oldBest)setNewBest(true); localStorage.setItem("snack-stack-best",String(next)); return next; }); return total; });
      if(!hasMoves(result.board))setGameOver(true); return result.board;
    });
  },[gameOver]);
  useEffect(()=>{ const onKey=(e:KeyboardEvent)=>{ const dirs:Record<string,Direction>={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down"}; if(dirs[e.key]){e.preventDefault();move(dirs[e.key]);}}; window.addEventListener("keydown",onKey); return()=>window.removeEventListener("keydown",onKey);},[move]);
  const restart=()=>{setBoard(freshBoard());setScore(0);setGameOver(false);setNewBest(false);};
  return <main className="game-shell"><section className="game-card" aria-label="Snack Stack merge game">
    <header><div className="brand-block"><p className="eyebrow">5 × 5 MERGE GAME</p><h1>SNACK<br/><span>STACK!</span></h1><p className="tagline">Slide. Match. Feast.</p></div>
      <div className="score-panel"><div className="score-box"><span>SCORE</span><strong>{score.toLocaleString()}</strong></div><div className="score-box"><span>BEST</span><strong>{best.toLocaleString()}</strong>{newBest&&<em>NEW!</em>}</div><button className="restart" onClick={restart} aria-label="Restart game">↻ <span>Restart</span></button></div></header>
    <div className="quest-bar"><span className="quest-icon">🧋</span><div><small>TODAY’S CRAVING</small><strong>Make a Boba Tea!</strong></div><span className="quest-progress">{Math.min(board.filter(v=>v>=5).length,1)} / 1</span></div>
    <div className="board-wrap" onTouchStart={e=>{const t=e.touches[0];touchStart.current={x:t.clientX,y:t.clientY};}} onTouchEnd={e=>{if(!touchStart.current)return;const t=e.changedTouches[0],dx=t.clientX-touchStart.current.x,dy=t.clientY-touchStart.current.y;touchStart.current=null;if(Math.max(Math.abs(dx),Math.abs(dy))<28)return;move(Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up"));}}>
      <div className="board" role="grid" aria-label="5 by 5 game board">{board.map((value,index)=>{const item=value?ITEMS[Math.min(value-1,ITEMS.length-1)]:null;return <div className={`tile tile-${Math.min(value,8)} ${value?"filled":""}`} key={index} role="gridcell" aria-label={item?.name||"Empty"}>{item&&<><span className="emoji">{item.emoji}</span><small>{item.name}</small></>}</div>;})}</div>
      {gameOver&&<div className="game-over"><span>🍽️</span><h2>Kitchen’s full!</h2><p>You stacked up {score.toLocaleString()} points.</p><button onClick={restart}>Play again</button></div>}
    </div>
    <div className="instructions"><div className="key-demo"><kbd>↑</kbd><span><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></span></div><p><strong>HOW TO PLAY</strong>Swipe or use arrow keys to slide.<br/>Match two snacks to make a tastier one!</p></div>
    <p className="tip"><span>✦</span> Keep a high-level snack tucked in a corner.</p>
  </section></main>;
}
