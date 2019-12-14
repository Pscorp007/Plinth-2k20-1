var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var User = require('../schema/user');
var Verify = require('./verify');
var Utils = require('./utils');
var Payment = require('../schema/payment');
var paytm = require('../config/paytm');
var checksum = require('../checksum/checksum');
var cadis = require('../config/cadis');



var hostURL = process.env.HOST_URL;
var id_tag = process.env.NODE_ENV === 'development' ? 'dev' : '2019';

router.get('/admin/check/:id', Verify.verifyOrdinaryUser, function (req, res) {
    var url;
    paramaters = {
        ORDER_ID: req.params.id,
        MID: paytm.mid,
    }



    checksum.genchecksum(paramaters, paytm.key, function (err, result) {

        url = 'https://securegw-stage.paytm.in/merchant-status/getTxnStatus?JsonData={%22MID%22:%22' + result['MID'] + '%22,%22ORDERID%22:%22' + result['ORDER_ID'] + '%22,%22CHECKSUMHASH%22:%22' + result['CHECKSUMHASH'] + '%22}';

        var request = require('request');

        request.post(url, function (error, response, body) {
            res.json(JSON.parse(body));
            return;
        });

    });
});

router.post('/register/:payName', Verify.verifyOrdinaryUser, function (req, res) {

    var payment = new Payment();
    var payName = req.params.payName;
    console.log(req);
    if (payName != '') {
        Payment.count({}, function (err, count) {
            var param_data = JSON.parse(req.body.postData);
            payment.event.eventName = param_data.eventName;
            payment.event.payName = payName;
            payment.event.clubName = param_data.clubName;
            payment.email = param_data.mEmail;
            payment.status = 'OPEN';
            payment.date.createdAt = '' + new Date();
            payment.team = param_data.details.teams;
            payment.accomodation = param_data.details.accomodation;
            payment.teamName = param_data.details.teamName;
            payment.referrer = param_data.referrer;
            var order_id = "Plinth-" + payName + "-" + (count + 1) + "-" + id_tag;
            payment.orderId = order_id;
            payment.teamSize = payment.team.length;

            payment.save(function (err) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    var bulk = User.collection.initializeOrderedBulkOp();
                    bulk.find({
                        'email': payment.email
                    }).update({
                        $push: {
                            rEvents: payment
                        }
                    });
                    bulk.execute();
                    Utils.saveSheet(payment);
                    res.json({
                        status: true,
                        orderId: payment.orderId
                    });
                    return;
                }
            });
        });
    } else {
        res.redirect('/404');
    }

});


router.post('/initiate/:payName', Verify.verifyOrdinaryUser, function (req, res) {
    var payName = req.params.payName;

    if (payName != '') {


        Payment.findOne({
            'orderId': req.body.orderId
        }, function (err, payment) {


            if (err)
                return done(err);

            if (payment) {
                var test = false;
                var str = payment.referrer.substring(7, 10);
                if (/^([0-3]|[0-3][0-9]|[0-3][0-9][0-9])$/.test(str)) {
                    test = true;
                }
                if (payment.referrer.indexOf(cadis.dis) > -1 && payment.referrer.length == 10 && test) {
                    switch (payName) {

                        case 'MUN':

                            if (payment.team[0].delegation == 'IP') {
                                payment.amount = 900;
                            } else {
                                payment.amount = 1500;
                            }

                            break;
                        case 'SIF':

                            if (payment.team[0].type == 'Startup') {
                                payment.amount = 1200;
                            } else {
                                payment.amount = 100 * 0.95;
                            }
                            break;
                        case 'INT':
                        case 'AH':
                        case 'AQ':
                            payment.amount = 100 * payment.teamSize * 0.95;
                            break;
                        case 'RST':
                            payment.amount = 200 * 0.95;
                            break;
                        case 'COM':
                            payment.amount = 200 * 0.95;
                            break;
                        case 'IUPC':
                            payment.amount = 250 * 0.95;
                            break;
                        case 'ENCS':
                            payment.amount = 200 * 0.95;
                            break;
                        case 'BW':
                            payment.amount = 200 * 0.95;
                            break;
                        case 'TQ':
                            payment.amount = 200 * 0.95;
                            break;
                        case 'RW':
                            payment.amount = 800 * 0.95;
                            break;
                        case 'RS':
                            payment.amount = 250 * 0.95;
                            break;
                        case 'DO':
                            payment.amount = 600 * 0.95;
                            break;
                        case 'LWF':
                            payment.amount = 250 * 0.95;
                            break;
                        case 'MS':
                            payment.amount = 250 * 0.95;
                            break;
                        case 'RR':
                            payment.amount = 250 * 0.95;
                            break;
                        case 'RCP':
                            payment.amount = 500 * 0.95;
                            break;
                        case 'TP':
                            payment.amount = 250 * 0.95;
                            break;
                        case 'IC':
                            payment.amount = 500 * 0.95;
                            break;
                        case 'CD':
                            payment.amount = 250 * 0.95;
                            break;
                        case 'WR':
                            payment.amount = 250 * 0.95;
                            break;
                        case 'AIML':
                            payment.amount = 600 * 0.95;
                            break;
                        case 'WEBD':
                            payment.amount = 350 * 0.95;
                            break;
                        case 'AND':
                            payment.amount = 350 * 0.95;
                            break;
                        case 'DES':
                            payment.amount = 100 * 0.95;
                            break;
                        case 'POD':
                            payment.amount = 100 * 0.95;
                            break;
                        case 'KA':
                            payment.amount = 300 * 0.95;
                            break;
                        case 'RSC':
                            payment.amount = 100 * 0.95;
                            break;
                        default:
                            payment.amount = 1000;
                            break;
                    }
                } else if (payment.referrer.indexOf(cadis.kadis) > -1) {
                    switch (payName) {
                        case 'KA':
                            payment.amount = 150;
                            break;
                        default:
                            payment.amount = 1000;
                            break;
                    }
                } else {
                    switch (payName) {

                        case 'MUN':

                            if (payment.team[0].delegation == 'IP') {
                                payment.amount = 900;
                            } else {
                                payment.amount = 1500;
                            }

                            break;
                        case 'SIF':

                            if (payment.team[0].type == 'Startup') {
                                payment.amount = 1200;
                            } else {
                                payment.amount = 100;
                            }
                            break;
                        case 'INT':
                        case 'AH':
                        case 'AQ':
                            payment.amount = 100 * payment.teamSize;
                            break;
                        case 'RST':
                            payment.amount = 200;
                            break;
                        case 'COM':
                            payment.amount = 200;
                            break;
                        case 'IUPC':
                            payment.amount = 250;
                            break;
                        case 'ENCS':
                            payment.amount = 200;
                            break;
                        case 'BW':
                            payment.amount = 200;
                            break;
                        case 'TQ':
                            payment.amount = 200;
                            break;
                        case 'RW':
                            payment.amount = 800;
                            break;
                        case 'RS':
                            payment.amount = 250;
                            break;
                        case 'DO':
                            payment.amount = 600;
                            break;
                        case 'LWF':
                            payment.amount = 250;
                            break;
                        case 'MS':
                            payment.amount = 250;
                            break;
                        case 'RR':
                            payment.amount = 250;
                            break;
                        case 'RCP':
                            payment.amount = 500;
                            break;
                        case 'TP':
                            payment.amount = 250;
                            break;
                        case 'IC':
                            payment.amount = 500;
                            break;
                        case 'CD':
                            payment.amount = 250;
                            break;
                        case 'WR':
                            payment.amount = 250;
                            break;
                        case 'AIML':
                            payment.amount = 600;
                            break;
                        case 'WEBD':
                            payment.amount = 350;
                            break;
                        case 'AND':
                            payment.amount = 350;
                            break;
                        case 'DES':
                            payment.amount = 100;
                            break;
                        case 'POD':
                            payment.amount = 100;
                            break;
                        case 'KA':
                            payment.amount = 300;
                            break;
                        case 'RSC':
                            payment.amount = 100;
                            break;
                        default:
                            payment.amount = 1000;
                            break;
                    }
                }


                payment.save(function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                        paramaters = {
                            REQUEST_TYPE: "DEFAULT",
                            ORDER_ID: payment.orderId,
                            CUST_ID: "plinth-" + payment.email,
                            TXN_AMOUNT: payment.amount,
                            CHANNEL_ID: 'WEB',
                            INDUSTRY_TYPE_ID: paytm.industryID,
                            MID: paytm.mid,
                            WEBSITE: paytm.website,
                            CALLBACK_URL: hostURL + '/payment/response',

                        }
                        console.log(paramaters);


                        checksum.genchecksum(paramaters, paytm.key, function (err, result) {
                            console.log(result);
                            result['PAYTM_URL'] = paytm.url;
                            res.render('pgredirect', {
                                'restdata': result
                            });
                        });
                    }
                });
            }
        });
    } else {
        res.redirect('/404');
    }

});

router.post('/response', Verify.verifyOrdinaryUser, function (req, res) {

    var isLoggedIn;
    var user;
    if (req.decoded.sub === "") {
        isLoggedIn = false;
    } else {
        User.findOne({
            'email': req.decoded.sub
        }, function (err, data) {

            isLoggedIn = data.valid;
            user = data;
        });
    }
    var paramlist = req.body;
    console.log(paramlist);
    if (checksum.verifychecksum(paramlist, paytm.key)) {
        Payment.findOneAndUpdate({
            'orderId': paramlist.ORDERID
        }, {
            $set: {
                'status': paramlist.STATUS,
                'tranId': paramlist.TXNID,
                'date.paidAt': '' + new Date()
            }
        }, {
            'new': true
        }, function (err1, result) {
            if (err1) {
                console.log(err1)
                return;
            } else {


                if (paramlist.STATUS === "TXN_FAILURE") {


                    var bulkR = User.collection.initializeOrderedBulkOp();

                    bulkR.find({
                        'email': result.email
                    }).update({
                        $pull: {
                            rEvents: {
                                orderId: result.orderId
                            }
                        }
                    });


                    bulkR.execute();

                    Utils.updateSheet(result);
                    res.render('paystatus', {
                        "page": 'paystatus',
                        "isLoggedIn": isLoggedIn,
                        "user": user,
                        "status": 'fail',
                        details: result,
                    })
                    return;
                }

                if (paramlist.STATUS === "TXN_SUCCESS") {
                    var emails = [];
                    for (var i = 0; i < result.team.length; i++) {
                        emails.push(result.team[i].email);

                    }
                    if (emails.indexOf(result.email) == -1) {
                        emails.push(result.email);
                    }
                    var bulk = User.collection.initializeOrderedBulkOp();
                    for (var i = 0; i < emails.length; i++) {
                        bulk.find({
                            'email': emails[i]
                        }).update({
                            $push: {
                                events: result
                            }
                        });

                    }
                    bulk.execute();

                    var bulkR = User.collection.initializeOrderedBulkOp();

                    bulkR.find({
                        'email': result.email
                    }).update({
                        $pull: {
                            rEvents: {
                                orderId: result.orderId
                            }
                        }
                    });


                    bulkR.execute();

                    Utils.updateSheet(result);
                    Utils.mail(result);
                    res.render('paystatus', {
                        "page": 'paystatus',
                        "isLoggedIn": isLoggedIn,
                        "user": user,
                        "status": 'success',
                        details: result,
                    });
                } else {
                    res.render('paystatus', {
                        "page": 'paystatus',
                        "isLoggedIn": isLoggedIn,
                        "user": user,
                        "status": 'open',
                        details: result,
                    })
                }
                var test = false;
                var str = result.referrer.substring(7, 10);
                if (/^([0-3]|[0-3][0-9]|[0-3][0-9][0-9])$/.test(str)) {
                    test = true;
                }
                if (result.referrer.indexOf(cadis.dis) > -1 && result.referrer.length == 10 && test || result.referrer.indexOf(cadis.kadis) > -1) {
                    Utils.capSheet({
                        date: result.date.paidAt,
                        name: result.referrer,
                        orderId: result.orderId,
                        status: result.status,
                        amount: result.amount
                    });
                }

                if (result.accomodation == 'Yes' || result.accomodation == 'YES') {
                    Utils.accSheet({
                        date: result.date.paidAt,
                        email: result.email,
                        orderId: result.orderId,
                        status: result.status,
                        team: result.teamName,
                        teamsize: result.teamSize,
                    });
                }

            }
        });
    } else {
        res.render('paystatus', {
            "page": 'paystatus',
            "isLoggedIn": isLoggedIn,
            "user": user,
            "status": 'fail',
            details: 'none',
        });
    }

});

module.exports = router;