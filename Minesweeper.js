import { PlayerView } from 'boardgame.io/core';


function MakeDoubleArray(Width,Height,GetInitCell)
{
	const Grid = new Array(Width);
	for ( let x=0;	x<Grid.length;	x++ )
	{
		Grid[x] = new Array(Height);
		for ( let y=0;	y<Grid[x].length;	y++ )
		{
			Grid[x][y] = GetInitCell(x,y);
		}
	}
	return Grid;
}

//	initial cell is unknown, we reveal on first move
function GetInitCell(x,y)
{
	return '?';
}

function Setup()
{
	const Width = 10;
	const Height = 10;
	const Game = {};
	
	//	the secret map just says where mines (M) are
	//	if it's a number, it's the player(1) who revealed it.
	//	Otherwise it's nothing (_)
	Game.secret = {};
	Game.secret.Map = null;
	
	//	the visible map shows what's known;
	//	revealed mine (1)
	//	unrevealed (?)
	//	or revealed (_)
	Game.Map = MakeDoubleArray(Width,Height,GetInitCell);
	
	return Game;
}

function EnumCells(Map,EnumCell)
{
	const Size = GetDoubleArraySize(Map);
	for ( let x=0;	x<Size.Width;	x++ )
	{
		for ( let y=0;	y<Size.Height;	y++ )
		{
			const Cell = Map[x][y];
			EnumCell(x,y,Cell);
		}
	}
}

//	return player number, false or true for draw
function IsFinished(Game)
{
	//	not initialised map yet
	if ( !Game.secret.Map )
		return false;
	
	//	keyed to player number
	let PlayerMineCount = {};
	let UnrevealedMineCount = 0;

	function EnumCell(x,y,Cell)
	{
		if ( Cell === 'M' )
		{
			UnrevealedMineCount++;
		}
		else if ( Cell === '_' )
		{
			return;
		}
		else
		{
			PlayerMineCount[Cell] = (PlayerMineCount[Cell]||0)+1;
		}
	}
	EnumCells( Game.secret.Map, EnumCell );
	
	//	not finished
	if ( UnrevealedMineCount > 0 )
		return false;
	
	//	who won!
	const Most = Math.max( ...Object.values(PlayerMineCount) );
	function IsPlayerMost(PlayerIndex)
	{
		return PlayerMineCount[PlayerIndex] === Most;
	}
	const ScoringPlayers = Object.keys(PlayerMineCount);
	const Winners = ScoringPlayers.filter( IsPlayerMost );
	
	if ( Winners.length === 0 )
		throw new Error(`No winners found; ${JSON.stringify(PlayerMineCount)}`);
	if ( Winners.length === 1 )
		return Winners[0];

	//	how do we have multiple winners?
	return true;
}

function GetFinishedState(G,ctx)
{
	const FinishedState = IsFinished(G);
	
	//	not finished
	if ( FinishedState === false )
		return undefined;
	
	//	draw
	if ( FinishedState === true )
	{
		return { draw: true }
	}
	
	//	player won
	return { winner: FinishedState };
}

function GetDoubleArraySize(Array)
{
	const Size = {};
	Size.Width = Array.length;
	Size.Height = Array[0].length;
	return Size;
}

function int2(x,y)
{
	const xy = {};
	xy.x = x;
	xy.y = y;
	return xy;
}

function MatchInt2(a,b)
{
	return a.x === b.x && a.y === b.y;
}

function InitGameMap(Size,SafePositions)
{
	//	work out mine positions
	const MinePositions = [];
	MinePositions.push( int2(0,0) );
	
	function IsMinePos(x,y)
	{
		const xy = int2(x,y);
		return MinePositions.some( Pos => MatchInt2(Pos,xy) );
	}
	
	function InitCell(x,y)
	{
		//	? = not revealed
		//	M = mine
		const IsMine = IsMinePos(x,y);
		return IsMine ? 'M' : '_';
	}
	
	const Map = MakeDoubleArray( Size.Width, Size.Height, InitCell );
	return Map;
}

/*
function ClickCoord(xy,OnStateChanged)
{
	const x = xy[0];
	const y = xy[1];
	const GridSize = this.GetGridSize();
	
	//	check bounds
	if ( x < 0 || x >= GridSize[0] )
		throw `x clicked out of bounds ${x} / ${GridSize[0]}`;
	if ( y < 0 || y >= GridSize[1] )
		throw `y clicked out of bounds ${y} / ${GridSize[1]}`;
	
	//	get cell
	const Cell = this.Map[x][y];
	
	//	check can be clicked
	if ( Cell.State != MinesweeperGridState.Hidden )
		throw `Clicked cell ${x},${y} state not hidden ${Cell.State}`;
	
	//	flood fill reveal
	if ( Cell.Neighbours == 0 )
	{
		await this.FloodReveal( x,y );
	}
	else
	{
		Cell.State = MinesweeperGridState.Revealed;
	}
	
	//	todo: flood fill reveal if Cell.Neighbours == 0
	//	todo: Death if clicked mine (and 1 player)
}
*/

//	probably should re-use clickcoord...
function FloodReveal(Map,x,y)
{
	const Cell = Map[x][y];
	//	already exposed
	if ( Cell !== '?' )
		return;
	
	//	reveal it
	Map[x][y] = 'X';
	/*
	const SafeClick = async function(x,y)
	{
		try
		{
			await this.ClickCoord([x,y]);
		}
		catch(e)
		{
		}
	}.bind(this);
	
	//	click neighbours
	await SafeClick(x-1,y-1);
	await SafeClick(x+0,y-1);
	await SafeClick(x+1,y-1);
	await SafeClick(x-1,y+0);
	//SafeClick(x+0,y+0);
	await SafeClick(x+1,y+0);
	await SafeClick(x-1,y+1);
	await SafeClick(x+0,y+1);
	await SafeClick(x+1,y+1);
	*/
}


function IsUnrevealed(Map,xy)
{
	const Cell = Map[xy.x][xy.y];
	console.log(`IsUnrevealed(${Cell})`);
	return Cell === '?';
}

function IsMine(Map,xy)
{
	const Cell = Map[xy.x][xy.y];
	return Cell === 'M';
}

function ClickMap(G,ctx,x,y)
{
	const Player = ctx.currentPlayer;
	const xy = int2(x,y);
	console.log("ClickMap",JSON.stringify(G) );

	//	init the board on first click
	if ( !G.secret.Map )
	{
		G.secret.Map = InitGameMap( GetDoubleArraySize(G.Map), [xy] );
	}
	
	if ( !IsUnrevealed(G.Map,xy) )
	{
		//	invalid move
		//	don't advance
		console.log('Invalid move, clicking already revealed cell');
	}
	else if ( IsMine(G.secret.Map,xy) )
	{
		//	click the secret cell and update the map
		G.secret.Map[xy.x][xy.y] = Player;
		G.Map[x][y] = Player;
		//	don't advance
	}
	else
	{
		//	reveal via floodfill
		FloodReveal(G.Map,x,y);
		ctx.events.endTurn();
	}

	console.log("PostClickMap",JSON.stringify(G) );
}

function GetMoves()
{
	const Moves = {};
	
	//	click only occurs on server as it manipulates secret
	Moves.click = { move: ClickMap, client: false };
	
	return Moves;
}

const TicTacToe =
{
	setup:		Setup,
	playerView:	PlayerView.STRIP_SECRETS,
	moves:		GetMoves(),
	endIf:		GetFinishedState,
};

export default TicTacToe;
