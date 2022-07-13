const Sauce = require("../models/Sauce");
const User = require("../models/User");
const fs = require("fs");
//cree une sauce
exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  sauce
    .save()
    .then(() => {
      res.status(201).json({ message: "Objet enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};
//recupere une seul sauce
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
  })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};
//modifier une sauce
exports.modifySauce = (req, res, next) => {
  //verifier si la requete contien une image
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete sauceObject._userId;
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        const Filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink(`images/${Filename}`, () => {
          Sauce.updateOne(
            { _id: req.params.id },
            { ...sauceObject, _id: req.params.id }
          )
            .then(() => res.status(200).json({ message: "Objet modifié!" }))
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};
//ajouter les likes
exports.addLikes = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id }).then((sauce) => {
    const userId = req.auth.userId;
    const usersLiked = sauce.usersLiked;
    const usersDisliked = sauce.usersDisliked;
    const likeStatus = req.body.like;
    switch (likeStatus) {
      case 1:
        //si userId n'existe pas dans le array usersLiked ajouter un like
        if (usersLiked.indexOf(userId) === -1) {
          Sauce.findOneAndUpdate(
            { _id: req.params.id },
            { $inc: { likes: 1 }, $push: { usersLiked: userId } }
          )
            .then(() => res.status(200).json({ message: "like Ajouter" }))
            .catch((error) => res.status(401).json({ error }));
        } else {
          res.status(403).json({ error: " vous ne pouvez pas like" });
        }
        break;
      case 0:
        //si userId existe dans l'array usersLiked suprimer le like
        if (usersLiked.indexOf(userId) > -1) {
          Sauce.findOneAndUpdate(
            { _id: req.params.id },
            { $inc: { likes: -1 }, $pull: { usersLiked: userId } }
          )
            .then(() => res.status(200).json({ message: "like suprimer" }))
            .catch((error) => res.status(401).json({ error }));
        }
        //si userId existe dans l'array usersDisliked suprimer le dislike
        else if (usersDisliked.indexOf(userId) > -1) {
          Sauce.findOneAndUpdate(
            { _id: req.params.id },
            { $inc: { dislikes: -1 }, $pull: { usersDisliked: userId } }
          )
            .then(() => res.status(200).json({ message: "disLike suprimer" }))
            .catch((error) => res.status(401).json({ error }));
        }
        //si tout ces cas ne sont pas verifier retourner un erreur 403
        else {
          res.status(403).json({ error: "erreur inconue " });
        }
        break;
      case -1:
        //si userId n'existe pas dans l'array usersDisliked ajouter un dislike
        if (usersDisliked.indexOf(userId) === -1) {
          Sauce.findOneAndUpdate(
            { _id: req.params.id },
            { $inc: { dislikes: 1 }, $push: { usersDisliked: userId } }
          )
            .then(() => res.status(200).json({ message: "dislike Ajouter" }))
            .catch((error) => res.status(401).json({ error }));
        } else {
          res.status(403).json({ error: " vous ne pouvez pas dislike" });
        }
        break;
    }
  });
};
//suprimer une sauce
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((user) => {
      if (user.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        const filename = user.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};
//recuperer toute les sauces
exports.getAllSauce = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};
