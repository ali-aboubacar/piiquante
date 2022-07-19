const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
//creation d'un utilisateur
exports.signup = (req, res, next) => {
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      const user = new User({
        email: req.body.email,
        password: hash,
      });
      user
        .save()
        .then(() => res.status(201).json({ message: "Utilisateur créé !" }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
//utiliser bcrypte pour comparer le password saisie
exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res
          .status(401)
          .json({ message: "Paire login/mot de passe incorrecte" });
      } else {
        //si la reponse est true comparer le password avec bcrypt
        bcrypt
          .compare(req.body.password, user.password)
          .then((valid) => {
            //si la reponse est false
            if (!valid) {
              return res
                .status(401)
                .json({ message: "Paire login/mot de passe incorrecte" });
            } else {
              //si valid est true creer un jwt_token
              res.status(200).json({
                userId: user._id,

                token: jwt.sign(
                  { email: maskEmail(user.email), userId: user._id },
                  process.env.JWT_SECRET,
                  {
                    expiresIn: "24h",
                  }
                ),
              });
            }
          })
          .catch((error) => res.status(500).json({ error }));
      }
    })
    .catch((error) => res.status(500).json({ error }));
};

function maskEmail(email) {
  const firstCharacter = email.slice(0, 1);
  const lastPart = email.match(/\D{1}[A-Za-z]+\D{1}[a-z]{2,}$/gi);
  const slicedEmail = email.slice(1, email.indexOf("@") - email.length);
  const splitEmailArr = slicedEmail.split("");
  let asterixArr = [];

  for (let i = 0; i < splitEmailArr.length; i++) {
    let asterix = splitEmailArr[i].replace(splitEmailArr[i], "*");
    asterixArr.push(asterix);
  }
  function addAllParts(...arr) {
    return arr.reduce(function (acc, curr) {
      return acc + curr;
    });
  }
  const hashedEmail = addAllParts(firstCharacter, ...asterixArr, lastPart);
  return hashedEmail;
}
