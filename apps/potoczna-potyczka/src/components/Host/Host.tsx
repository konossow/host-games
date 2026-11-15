import React, {FunctionComponent, useEffect, useMemo, useState} from "react";
import "./Host.css";
import {useMultiplayerState} from "playroomkit";
import {usePrompt} from "../../hooks/usePrompt";
import {defaultGameState} from "../../model/GameState";
import {GameMode} from "../../model/GameMode";
import {AutoComplete, Button, Input, Radio, Select, Slider, Space} from "antd";
import {GameTheme} from "../../model/GameTheme";
import {enumToOptions} from "../../helpers/enumToOptions";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowsRotate, faCaretLeft, faCaretRight, faEye, faMinus, faTimes, faTrash} from "@fortawesome/free-solid-svg-icons";
import {deepCopy} from "../../helpers/deepCopy";
import {TeamSide} from "../../model/Team";

const Host: FunctionComponent = () => {
  const prompt = usePrompt();
  const [gameState, setGameState] = useMultiplayerState('gameState', defaultGameState);
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [themes, setThemes] = useState<GameTheme[]>([]);
  const [teamName0, setTeamName0] = useState<string>(gameState.teamsInfo[0].name);
  const [teamName1, setTeamName1] = useState<string>(gameState.teamsInfo[1].name);
  const [totalRounds, setTotalRounds] = useState<number>(gameState.totalRounds);
  const [mode, setMode] = useState<GameMode>(gameState.mode);
  const [seed, setSeed] = useState<string>();
  const [chooseWinner, setChooseWinner] = useState<boolean>(false);
  const [scoreLimit, setScoreLimit] = useState<number>();
  const availableSkips = useMemo(() => gameState.availableQuestions.length - gameState.seenQuestionsIds.length, [gameState.availableQuestions, gameState.seenQuestionsIds])

  const getSeeds = (search?: string) => {
    const seeds = ['valhalla', 'host', 'klubokawiarnia', 'motty', 'demo'];
    if (!search || seeds.includes(search)) {
      return seeds.map(value => ({value}));
    }
    return seeds.concat(search).map(value => ({value}));
  }

  const [seeds, setSeeds] = useState<{value: string}[]>(getSeeds());

  useEffect( () => {
    const checkPassword = async () => {
      while (true) {
        const password = await prompt();
        if (password === '2274') {
          setAuthorized(true);
          break;
        }
      }
    };

    checkPassword();
  }, []);

  if (!authorized) {
    return null;
  }

  const drawQuestion = (seenQuestionsIds: number[]) => {
    let question = gameState.availableQuestions[Math.floor(Math.random() * gameState.availableQuestions.length)];
    while (seenQuestionsIds.includes(question.id)) {
      question = gameState.availableQuestions[Math.floor(Math.random() * gameState.availableQuestions.length)];
    }
    return question;
  }

  const nextQuestion = (winner: 0 | 1) => {
    let {seenQuestionsIds, round, totalRounds, question, pot, teamsInfo, finished} = deepCopy(gameState);
    round = round! + 1;
    seenQuestionsIds.push(question!.id);
    teamsInfo[winner].score += pot;
    teamsInfo.forEach(team => team.errors = 0);
    finished = (scoreLimit ? teamsInfo[winner].score >= scoreLimit : false) || round > totalRounds;
    if (!finished) {
      question = drawQuestion(seenQuestionsIds);
    }
    setChooseWinner(false);
    setGameState({
      ...gameState,
      question,
      seenQuestionsIds,
      round,
      finished,
      pot: 0,
      teamsInfo
    })
  }

  const skipQuestion = () => {
    let {seenQuestionsIds, question} = deepCopy(gameState);
    question = drawQuestion(seenQuestionsIds);
    setGameState({
      ...gameState,
      question,
      seenQuestionsIds
    })
  }

  const revealAnswer = (id: number, withScore = true) => {
    let {question, pot} = deepCopy(gameState);
    question!.answers[id].revealed = true;
    if (withScore) {
      pot += question!.answers[id].points;
    }
    setGameState({
      ...gameState,
      question,
      pot
    });
  }

  const onMistake = (teamSide?: TeamSide, clear?: boolean) => {
    let {teamsInfo} = deepCopy(gameState);
    if (teamSide === undefined) {
      teamsInfo.forEach(team => team.errors = clear ? 0 : 3);
    } else {
      teamsInfo[teamSide].errors = clear ? 0 : (teamsInfo[teamSide].errors + 1) % 4;
    }
    setGameState({
      ...gameState,
      teamsInfo
    })
  }

  const startGame = () => {
    let {teamsInfo} = deepCopy(gameState);
    teamsInfo[0].name = teamName0;
    teamsInfo[1].name = teamName1;
    setGameState({
      ...gameState,
      themes,
      teamsInfo,
      totalRounds,
      mode,
      seed,
      scoreLimit,
      started: true
    })
  }

  const updateTeams = () => {
    let {teamsInfo} = deepCopy(gameState);
    teamsInfo[0].name = teamName0;
    teamsInfo[1].name = teamName1;
    setGameState({
      ...gameState,
      teamsInfo
    })
  }

  const onThemesChange = (themes: GameTheme[]) => {
    if (themes.includes(GameTheme.Wedding)) {
      setTeamName0('Drużyna Pani Młodej');
      setTeamName1('Drużyna Pana Młodego');
      setMode(GameMode.Classic);
      setSeed(undefined);
      setTotalRounds(20);
    }
    setThemes(themes);
  }

  const renderSetup = () => (
    <>
      <Select
        mode="multiple"
        allowClear
        style={{ width: '100%' }}
        placeholder="Themes"
        value={themes}
        onChange={onThemesChange}
        options={enumToOptions(GameTheme)}
      />
      <Radio.Group value={mode} block options={enumToOptions(GameMode)} optionType="button" onChange={e => setMode(e.target.value)} />
      <AutoComplete
        value={seed}
        options={seeds}
        style={{ width: '100%' }}
        onSelect={setSeed}
        onSearch={search => setSeeds(getSeeds(search))}
        onChange={setSeed}
        placeholder="Seed (optional)"
        allowClear
      />
      <Input placeholder="Left team name" value={teamName0} onChange={e => setTeamName0(e.target.value)} onBlur={updateTeams}/>
      <Input placeholder="Right team name" value={teamName1} onChange={e => setTeamName1(e.target.value)} onBlur={updateTeams}/>
      <Slider value={totalRounds} min={5} max={20} tooltip={{ open: true }} onChange={setTotalRounds} />
      <Slider value={scoreLimit} min={0} max={1000} step={100} tooltip={{ open: true }} onChange={setScoreLimit} />
      <Button block onClick={startGame}>Start</Button>
    </>
  )

  const renderControlPanel = () => (
    <>
      <Space.Compact block>
        <Space.Compact direction="vertical" block>
          <Button size="large" block onClick={() => onMistake(TeamSide.LEFT)}>{(gameState.teamsInfo[TeamSide.LEFT].errors + 1) % 4}<FontAwesomeIcon icon={faTimes}/></Button>
          <Button size="large" block onClick={() => onMistake(TeamSide.LEFT, true)}><FontAwesomeIcon icon={faTrash}/></Button>
        </Space.Compact>
        <Space.Compact direction="vertical" block>
          <Button size="large" block onClick={() => onMistake()}>
            <FontAwesomeIcon icon={faTimes}/>
            <FontAwesomeIcon icon={faTimes}/>
            <FontAwesomeIcon icon={faTimes}/>
          </Button>
          <Button size="large" block onClick={() => onMistake(undefined, true)}>
            <FontAwesomeIcon icon={faMinus}/>
            <FontAwesomeIcon icon={faMinus}/>
            <FontAwesomeIcon icon={faMinus}/>
          </Button>
        </Space.Compact>
        <Space.Compact direction="vertical" block>
          <Button size="large" block onClick={() => onMistake(TeamSide.RIGHT)}>{(gameState.teamsInfo[TeamSide.RIGHT].errors + 1) % 4}<FontAwesomeIcon icon={faTimes}/></Button>
          <Button size="large" block onClick={() => onMistake(TeamSide.RIGHT, true)}><FontAwesomeIcon icon={faTrash}/></Button>
        </Space.Compact>
      </Space.Compact>
      <p style={{textAlign: 'center', lineHeight: '16px'}}>
        {availableSkips > 1 && <FontAwesomeIcon style={{marginInline: '4px'}} icon={faArrowsRotate} onClick={skipQuestion}/>}
        {gameState.question?.description}
      </p>
      <Space.Compact direction="vertical">
        {gameState.question?.answers.map((answer, i) => (
          <Space.Compact block key={answer.points}>
            <Button size="large" block disabled={answer.revealed} key={i} onClick={() => revealAnswer(i)}>{answer.points} / {answer.description}</Button>
            <Button size="large" key={`${i}-show`} disabled={answer.revealed} onClick={() => revealAnswer(i, false)}><FontAwesomeIcon icon={faEye}/></Button>
          </Space.Compact>
        ))}
      </Space.Compact>
      <Space.Compact block>
        <Button size="large" disabled={!chooseWinner} onClick={() => nextQuestion(TeamSide.LEFT)}><FontAwesomeIcon icon={faCaretLeft}/></Button>
        <Button size="large" block onClick={() => setChooseWinner(!chooseWinner)}>{chooseWinner ? 'Kto wygrał?' : 'Następne pytanie'}</Button>
        <Button size="large" disabled={!chooseWinner} onClick={() => nextQuestion(TeamSide.RIGHT)}><FontAwesomeIcon icon={faCaretRight}/></Button>
      </Space.Compact>
    </>
  )

  const renderGameOver = () => (
    <Button size="large" onClick={() => setGameState(defaultGameState)}>Zagraj ponownie</Button>
  )

  return (
    <div className="host">
      {gameState.started ?
        (gameState.finished ? renderGameOver() : renderControlPanel())
        : renderSetup()}
    </div>
  )
}
export default Host;
