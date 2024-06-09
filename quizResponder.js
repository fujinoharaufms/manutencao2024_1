import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDocs, getDoc } from 'firebase/firestore';
import { useAuthentication } from '../../hooks/useAuthentication';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../fireBaseConnection';
import './quizResponder.modules.css';

const Quiz = () => {
  const { quizId } = useParams();
  const { user } = useAuthentication();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {

    if (!user) {
      navigate('/Register'); // Redireciona se não houver usuário logado
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const quizDocRef = doc(db, 'quizzes', quizId);
        const quizSnapshot = await getDoc(quizDocRef);

        if (quizSnapshot.exists()) {
          const data = quizSnapshot.data();
          setQuizData(data);

          const questoesRef = collection(db, 'quizzes', quizId, 'questoes');
          const querySnapshot = await getDocs(questoesRef);

          const questoesArray = [];
          querySnapshot.forEach((doc) => {
            questoesArray.push(doc.data());
          });

          setQuizData(prevState => ({ ...prevState, questoes: questoesArray }));
          setUserAnswers(Array(questoesArray.length).fill(''));
        } else {
          console.error('Quiz não encontrado');
        }
      } catch (error) {
        console.error('Erro ao buscar informações do quiz:', error);
      }
    };

    fetchQuizData();
  }, [quizId]);

  useEffect(() => {
    const saveScoreToDB = async () => {
      if (quizCompleted && quizData && quizData.userId) {
        try {
          const scoresCollection = collection(db, 'scores');
          await addDoc(scoresCollection, {
            userId: quizData.userId,
            quizId: quizId,
            score,
          });
          console.log('Pontuação salva com sucesso:', score);
          console.log(quizData.userId)
        } catch (error) {
          console.error('Erro ao salvar pontuação:', error);
        }
      }
    };

    if (quizCompleted) {
      saveScoreToDB();
    }
  }, [quizCompleted, quizData, quizId, score]);

  const handleAnswerSelection = (selectedOption) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestionIndex] = selectedOption;
    setUserAnswers(updatedAnswers);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < (quizData?.questoes?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    let userScore = 0;
    quizData?.questoes?.forEach((question, index) => {
      if (userAnswers[index] === question.respostaCorreta) {
        userScore++;
      }
    });
    setScore(userScore);
  };

  const submitQuiz = () => {
    calculateScore();
    setQuizCompleted(true);
  };

  if (quizCompleted) {
    return (
      <div className="container-fluid text-center">
        <h3>Quiz Concluído!</h3>
        <h4>Sua Pontuação: {score}/{quizData.questoes.length}</h4>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Voltar</button>
      </div>
    );
  }

  if (!quizData || !quizData.questoes || quizData.questoes.length === 0) {
    return <div>Carregando quiz...</div>;
  }

  const currentQuestion = quizData.questoes[currentQuestionIndex];

  
  const selectedAnswer = userAnswers[currentQuestionIndex];

  return (
    <div className="container-fluid">
      <div className="row mx-auto text-center">
        {/* Barra lateral esquerda (mantenha ou remova conforme sua necessidade) */}
        <div className="col-md-3 custom-colorBar">
          {/* Conteúdo da barra lateral */}
        </div>

        {/* Conteúdo principal */}
        <div className="col-sm-9 text-center">
          <h3 className="d-flex justify-content-start">{quizData.nomeQuizz} - Questão {currentQuestionIndex + 1}/{quizData.questoes.length}</h3>
          <h4>{currentQuestion.pergunta}</h4>
          {selectedAnswer && <p>Resposta Selecionada: {selectedAnswer}</p>}
          <form className="boxRespostas mb-4">
            {currentQuestion.opcoes.map((option, index) => (
              <div className="mb-3" key={index}>
                <button 
                  type="button" 
                  className={`btn btn-primary custom-color${index + 1} estilo ${userAnswers[currentQuestionIndex] === option ? "selected-option" : ""}`}
                  onClick={() => handleAnswerSelection(option)}
                >
                  {option}
                </button>
              </div>
            ))}
          </form>

          <div className="d-flex justify-content-between">
            {currentQuestionIndex > 0 && (
              <button type="button" className="btn btn-primary ml-auto" onClick={goToPreviousQuestion}>Voltar</button>
            )}
            {currentQuestionIndex < quizData.questoes.length - 1 ? (
              <button type="button" className="btn btn-primary mr-auto" onClick={goToNextQuestion}>Próxima</button>
            ) : (
              <button type="button" className="btn btn-primary mr-auto" onClick={submitQuiz}>Finalizar Quiz</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;