import { useState, useEffect } from "react";

function Cell({ shot, isShip, isEnemy, isPreview, isInvalid, onClick, onMouseEnter, onMouseLeave, dataRow, dataCol }) {
  const [anim, setAnim] = useState("");

  // Dispara la animación cuando llega un disparo nuevo
  useEffect(() => {
    if (shot === "hit")  { setAnim("animate-explode"); }
    if (shot === "miss") { setAnim("animate-splash");  }
  }, [shot]);

  // Al colocar un barco
  useEffect(() => {
    if (isShip) { setAnim("animate-place"); }
  }, [isShip]);

  // Limpia la clase cuando termina la animación
  const handleAnimEnd = () => setAnim("");

  let classes = `w-8 h-8 border border-slate-700 flex items-center justify-center 
    text-sm rounded-sm transition-colors duration-150 select-none ${anim} `;

  if (shot === "hit")       classes += "bg-red-500 text-white cursor-default";
  else if (shot === "miss") classes += "bg-slate-800 text-blue-400 cursor-default";
  else if (isInvalid)       classes += "bg-red-900/50 cursor-not-allowed";
  else if (isPreview)       classes += "bg-blue-600/60 cursor-pointer";
  else if (isShip)          classes += "bg-blue-800 text-blue-300";
  else if (isEnemy)         classes += "bg-slate-900 hover:bg-blue-900 cursor-crosshair";
  else                      classes += "bg-slate-900 cursor-default";

  const symbol = shot === "hit" ? "✕" : shot === "miss" ? "·" : isShip ? "▪" : "";

        return (
            <div
            className={classes}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onAnimationEnd={handleAnimEnd}
            data-cell="true"    
            data-row={dataRow} 
            data-col={dataCol} 
            >
            {symbol}
            </div>
        );
    }

export default function Grid({ grid, shots, isEnemy, onShoot, active, preview }) {
  const previewCells = preview?.cells || [];
  const previewValid = preview?.valid ?? true;
  const cols = "ABCDEFGHIJ".split("");

  return (
    <div>
      <div className="flex ml-7">
        {cols.map(c => (
          <div key={c} className="w-8 text-center text-xs text-slate-500 font-mono">{c}</div>
        ))}
      </div>

      {grid.map((row, r) => (
        <div key={r} className="flex items-center">
          <div className="w-6 text-right text-xs text-slate-500 font-mono mr-1">{r + 1}</div>
          {row.map((cell, c) => {
            const shot   = shots?.[r][c];
            const isShip = !isEnemy && !!cell;
            const isPrev = previewCells.some(([pr, pc]) => pr === r && pc === c);
            const isInv  = isPrev && !previewValid;

                return (
                <Cell
                    key={c}
                    shot={shot}
                    isShip={isShip}
                    isEnemy={isEnemy && !shot}
                    isPreview={isPrev && previewValid}
                    isInvalid={isInv}
                    onClick={() => {
                    if (isEnemy && active && !shot) onShoot(r, c);
                    if (!isEnemy && preview) preview.onPlace?.(r, c);
                    }}
                    onMouseEnter={() => preview?.onHover?.(r, c)}
                    onMouseLeave={() => preview?.onHoverLeave?.()}
                    dataRow={r} 
                    dataCol={c} 
                />
                );
          })}
        </div>
      ))}
    </div>
  );
}