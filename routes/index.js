var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var User = require('../schema/user');
var Verify = require('./verify');
var passport = require('passport');
var Utils = require('./utils');

/* GET home page. */


router.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));



router.get('/auth/google/callback', function (req, res, next) {
    passport.authenticate('google', {
        scope: ['profile', 'email']
    }, function (err, user, info) {

        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({
                err: info
            });
        }

        req.logIn(user, function (err) {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    err: 'Could not log in user'
                });
            }
            var token = Verify.getToken(user);

            res.cookie('access-token', token, {
                httpOnly: true,
                secure: false
            });
            if (user.valid) {
                res.render('redirect', {
                    "page": 'redirect',
                    isLoggedIn: true,
                    valid: user.valid,
                    user: user
                });
            } else {
                res.render('redirect', {
                    "page": 'redirect',
                    isLoggedIn: false,
                    valid: user.valid,
                    user: user
                });
            }


        });
    })(req, res, next);
});


router.post('/user_register_complete', Verify.verifyOrdinaryUser, function (req, res) {

    var update = {
        phoneNumber: req.body.contact_number,
        college: req.body.institute,
        year: req.body.user_year,
        city: req.body.user_city,
        gender: req.body.gender,
        events: ['init'],
        rEvents: ['init'],
        valid: true,
    };
    console.log(update);
    User.findOneAndUpdate({
        'email': req.decoded.sub
    }, update, {
        new: true
    }, function (err, user) {
        if (err) {
            console.log('errr');
        }
        if (user) {
            res.cookie('access-token', Verify.getToken(user), {
                httpOnly: true,
                secure: false
            });
            Utils.resSheet(user);
            res.json({
                status: true
            });
            return;

        } else {
            res.json({
                status: false
            });
            return;
        }
    });
});


router.get('/', Verify.verifyOrdinaryUser, function (req, res, next) {
    if (req.decoded.sub === "") {
        isLoggedIn = false;
        res.render('index', {
            "page": 'home',
            "isLoggedIn": isLoggedIn,
        });
    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {
            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                res.render('index', {
                    "page": 'home',
                    "isLoggedIn": isLoggedIn,
                    "user": user
                });
            }
        });
    }


});

router.get('/competitions', Verify.verifyOrdinaryUser, function (req, res, next) {


    if (req.decoded.sub === "") {
        isLoggedIn = false;
        res.render('competitions', {
            "page": 'competitions',
            "isLoggedIn": isLoggedIn,

        });
    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {
            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                res.render('competitions', {
                    "page": 'competitions',
                    "isLoggedIn": isLoggedIn,
                    "user": user,

                });
            }
        });
    }


});

router.get('/competitions/:category', Verify.verifyOrdinaryUser, function (req, res, next) {
    var categories = ['astronomy', 'coding', 'robotics', 'quizzing', 'literature', 'management', 'pratibimb'];
    var competitionUrls = require('../data/competitions').competitionUrl;
    var category = req.params.category;
    var valid = false;
    if (categories.indexOf(category) > -1) {
        valid = true;
    }


    if (req.decoded.sub === "") {
        isLoggedIn = false;

        if (valid) {
            res.render('categories', {
                "page": category,
                "isLoggedIn": isLoggedIn,
                "category": category,
                "competitionUrl": competitionUrls.competitions,
            });
        } else {
            res.redirect('/competitions');
        }

    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {
            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                if (valid) {
                    res.render('categories', {
                        "page": category,
                        "isLoggedIn": isLoggedIn,
                        "user": user,
                        "category": category,
                        "competitionUrl": competitionUrls.competitions,
                    });
                } else {
                    res.redirect('/competitions');
                }

            }
        });
    }


});

router.get('/competitions/:category/:competition', Verify.verifyOrdinaryUser, function (req, res, next) {
    var competitionDetail = require('../data/competitions').competitions;
    var categories = ['astronomy', 'coding', 'robotics', 'quizzing', 'literature', 'management', 'pratibimb'];
    var competitions = {
        astronomy: ['intotheuniverse', 'astrohunt', 'astroquiz'],
        coding: ['iupc', 'enigma', 'cskaranaggarwal', 'hackthecode'],
        robotics: ['robowar', 'robosoccer', 'droneobstruction', 'lwf', 'mazesolver', 'roborace', 'rcplane', 'transporter', 'icengine', 'circuitdesign', 'waterrocket', 'electrothon'],
        quizzing: ['brandwagon', 'thequest'],
        literature: ['rostrum', 'comikaze'],
        management: ['sif'],
        pratibimb: ['design', 'poster']
    };
    var category = req.params.category;
    var competition = req.params.competition;
    var valid = false;

    var detail;
    if (categories.indexOf(category) > -1) {

        if (competitions[category].indexOf(competition) > -1) {
            valid = true;

            competitionDetail.competitions.forEach(element => {

                if (element.eventUrl == competition) {
                    detail = element;
                }
            });
        }

    }
    if (req.decoded.sub === "") {
        isLoggedIn = false;

        if (valid) {
            res.render('competition', {
                "page": competition,
                "isLoggedIn": isLoggedIn,
                "competition": detail,
            });
        } else {
            res.redirect('/competitions');
        }

    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {
            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                if (valid) {
                    res.render('competition', {
                        "page": competition,
                        "isLoggedIn": isLoggedIn,
                        "user": user,
                        "competition": detail,
                    });
                } else {
                    res.redirect('/competitions');
                }

            }
        });
    }


});



router.get('/workshops', Verify.verifyOrdinaryUser, function (req, res, next) {
    var workshopUrl = require('../data/workshops').workshopUrl;

    if (req.decoded.sub === "") {
        isLoggedIn = false;
        res.render('workshops', {
            "page": 'workshops',
            "isLoggedIn": isLoggedIn,
            "workshopUrl": workshopUrl.workshops,
        });
    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {

            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                res.render('workshops', {
                    "page": 'workshops',
                    "isLoggedIn": isLoggedIn,
                    "user": user,
                    "workshopUrl": workshopUrl.workshops,
                });
            }
        });
    }


});

router.get('/workshops/:workshop', Verify.verifyOrdinaryUser, function (req, res, next) {

    var workshopDetail = require('../data/workshops').workshops;
    var worskhops = ['aiandml', 'webdev', 'android', 'rubikscube'];
    var workshop = req.params.workshop;
    var detail;
    var valid = false;

    if (worskhops.indexOf(workshop) > -1) {


        valid = true;

        workshopDetail.workshops.forEach(element => {

            if (element.eventUrl == workshop) {

                detail = element;
            }
        });


    }


    if (req.decoded.sub === "") {
        isLoggedIn = false;
        if (valid) {
            res.render('workshop', {
                "page": workshop,
                "isLoggedIn": isLoggedIn,
                "workshop": detail,
            });
        } else {
            res.redirect('/workshops');
        }
    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {

            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                if (valid) {
                    res.render('workshop', {
                        "page": workshop,
                        "isLoggedIn": isLoggedIn,
                        "user": user,
                        "workshop": detail,
                    });
                } else {
                    res.redirect('/workshops');
                }
            }
        });
    }


});

router.get('/mun', Verify.verifyOrdinaryUser, function (req, res, next) {
    if (req.decoded.sub === "") {
        isLoggedIn = false;
        res.render('mun', {
            "page": 'mun',
            "isLoggedIn": isLoggedIn,
        });
    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {

            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                res.render('mun', {
                    "page": 'mun',
                    "isLoggedIn": isLoggedIn,
                    "user": user
                });
            }
        });
    }


});

router.get('/talks', Verify.verifyOrdinaryUser, function (req, res, next) {
    if (req.decoded.sub === "") {
        isLoggedIn = false;
        res.render('talks', {
            "page": 'talks',
            "isLoggedIn": isLoggedIn,
        });
    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {
            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                res.render('talks', {
                    "page": 'talks',
                    "isLoggedIn": isLoggedIn,
                    "user": user
                });
            }
        });
    }


});

router.get('/sop', Verify.verifyOrdinaryUser, function (req, res, next) {
    if (req.decoded.sub === "") {
        isLoggedIn = false;
        res.render('sop', {
            "page": 'sop',
            "isLoggedIn": isLoggedIn,
        });
    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {
            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                res.render('sop', {
                    "page": 'sop',
                    "isLoggedIn": isLoggedIn,
                    "user": user
                });
            }
        });
    }


});


router.get('/gallery', Verify.verifyOrdinaryUser, function (req, res, next) {

    if (req.decoded.sub === "") {
        isLoggedIn = false;
        res.render('gallery', {
            "page": 'gallery',
            "isLoggedIn": isLoggedIn,

        });
    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {
            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                res.render('gallery', {
                    "page": 'gallery',
                    "isLoggedIn": isLoggedIn,
                    "user": user,

                });
            }
        });
    }

});

router.get('/sponsors', Verify.verifyOrdinaryUser, function (req, res, next) {
    if (req.decoded.sub === "") {
        isLoggedIn = false;
        res.render('sponsors', {
            "page": 'sponsors',
            "isLoggedIn": isLoggedIn,
        });
    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {
            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                res.render('sponsors', {
                    "page": 'sponsors',
                    "isLoggedIn": isLoggedIn,
                    "user": user
                });
            }
        });
    }


});

router.get('/faqs', Verify.verifyOrdinaryUser, function (req, res, next) {
    if (req.decoded.sub === "") {
        isLoggedIn = false;
        res.render('faqs', {
            "page": 'faqs',
            "isLoggedIn": isLoggedIn,
        });
    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {
            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                res.render('faqs', {
                    "page": 'faqs',
                    "isLoggedIn": isLoggedIn,
                    "user": user
                });
            }
        });
    }


});

router.get('/team', Verify.verifyOrdinaryUser, function (req, res, next) {
    if (req.decoded.sub === "") {
        isLoggedIn = false;
        res.render('team', {
            "page": 'team',
            "isLoggedIn": isLoggedIn,
        });
    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {
            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                res.render('team', {
                    "page": 'team',
                    "isLoggedIn": isLoggedIn,
                    "user": user
                });
            }
        });
    }


});

router.get('/terms', Verify.verifyOrdinaryUser, function (req, res, next) {
    if (req.decoded.sub === "") {
        isLoggedIn = false;
        res.render('terms', {
            "page": 'terms',
            "isLoggedIn": isLoggedIn,
        });
    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {
            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                res.render('terms', {
                    "page": 'terms',
                    "isLoggedIn": isLoggedIn,
                    "user": user
                });
            }
        });
    }


});

router.get('/archive', Verify.verifyOrdinaryUser, function (req, res, next) {
    if (req.decoded.sub === "") {
        isLoggedIn = false;
        res.render('archive', {
            "page": 'archive',
            "isLoggedIn": isLoggedIn,
        });
    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {
            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                res.render('archive', {
                    "page": 'archive',
                    "isLoggedIn": isLoggedIn,
                    "user": user
                });
            }
        });
    }


});

router.get('/profile', Verify.verifyOrdinaryUser, function (req, res, next) {

    if (req.decoded.sub === "") {
        isLoggedIn = false;
        res.redirect(301, '/');
    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {
            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                res.render('profile', {
                    "page": 'profile',
                    "isLoggedIn": isLoggedIn,
                    "user": user
                });
            }
        });
    }


});

router.get('/ca', Verify.verifyOrdinaryUser, function (req, res, next) {
    if (req.decoded.sub === "") {
        isLoggedIn = false;
        res.render('ca', {
            "page": 'Campus Ambassdor',
            "isLoggedIn": isLoggedIn,
        });
    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {

            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                res.render('ca', {
                    "page": 'ca',
                    "isLoggedIn": isLoggedIn,
                    "user": user
                });
            }
        });
    }


});

router.get('/proshow', Verify.verifyOrdinaryUser, function (req, res, next) {
    if (req.decoded.sub === "") {
        isLoggedIn = false;
        res.render('proshow', {
            "page": 'proshow',
            "isLoggedIn": isLoggedIn,
        });
    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, user) {
            isLoggedIn = user.valid;
            // if there are any errors, return the error
            if (err)
                return done(err);
            // check to see if theres already a user with that email
            if (user) {
                res.render('proshow', {
                    "page": 'proshow',
                    "isLoggedIn": isLoggedIn,
                    "user": user
                });
            }
        });
    }


});



module.exports = router;