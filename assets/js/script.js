/******************************************************************
 Events
 ******************************************************************/

$(document).ready(
    function($) {
        moment.locale('ru');

        // MailChimp function
        window.fnames = new Array();
        window.ftypes = new Array();
        fnames[0] = 'EMAIL';
        ftypes[0] = 'email';
        fnames[1] = 'FNAME';
        ftypes[1] = 'text';
        fnames[2] = 'LNAME';
        ftypes[2] = 'text';
        // var $mcj = jQuery.noConflict(true);

        $('input[name="input_deadline"]').daterangepicker(
            {
                language: 'ru',
                startDate: moment(),
                endDate: moment().add('90', 'days'),
                buttonClasses: ['btn btn-default'],
                applyClass: 'btn-small btn-primary',
                cancelClass: 'btn-small',
                locale: {
                    format: 'DD MMMM YYYY'
                }
            }
        );

        $(".flat-slider-vertical-bad, .flat-slider-vertical-good, .flat-slider-vertical-likely")
            .slider({
                max: 100,
                min: 0,
                range: "min",
                orientation: "vertical",
                step: 5
            })
            .slider("pips", {
                first: "pip",
                last: "pip"
            })
            .slider("float");

        $(".flat-slider-vertical-bad")
            .slider({
                value: 50,
            });

        $(".flat-slider-vertical-likely")
            .slider({
                value: 20,
            });

        $(".flat-slider-vertical-good")
            .slider({
                value: 00,
            });

        $("input[type='checkbox']").change(function () {
            if ($(this).is(':checked')) {
                $('.' + $(this).attr('id')).show();
            } else {
                $('.' + $(this).attr('id')).hide();
            }
        });

        $("#btn_run").click(function () {
            calculateRisks();
        });

        $("#mc-embedded-subscribe").click(function () {
            $("#mc_embed_signup").hide();
        });

        google.charts.load('current', {'packages': ['bar']});
    }
);





/******************************************************************
 Functions
 ******************************************************************/

function calculateRisks() {

    // Get range od dates
    var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds

    var startDate = $('input[name="input_deadline"]').data('daterangepicker').startDate._d;
    var endDate = $('input[name="input_deadline"]').data('daterangepicker').endDate._d;
    var diffDays = Math.round(Math.abs((startDate.getTime() - endDate.getTime())/(oneDay)));
    console.log('Days: ' + diffDays);


    var riskology = new Riskology(diffDays, 30);

    for (var i = 0; i < $('.toggle input[type="checkbox"]').length; i++) {
        if ($('#risk-' + (i + 1)).is(':checked')) {
            var bad = parseInt($('.risk-' + (i + 1)).find('div.flat-slider-vertical-bad span.ui-slider-tip').text());
            var likely = parseInt($('.risk-' + (i + 1)).find('div.flat-slider-vertical-likely span.ui-slider-tip').text());
            var good = parseInt($('.risk-' + (i + 1)).find('div.flat-slider-vertical-good span.ui-slider-tip').text());

            if (bad != 0) bad /= 100;
            if (likely != 0) likely /= 100;
            if (good != 0) good /= 100;

            var risk = new RiskFactor(bad, likely, good);
            riskology.addRisk(risk);
        }
    }

    if(riskology.getRiskCount() == 0) {
        var risk = new RiskFactor(0, 0, 0);
        riskology.addRisk(risk);
    }

    $('.result-container').show();
    drawHistogram(riskology);
};


function drawHistogram(riskology) {
    var startDate = $('input[name="input_deadline"]').data('daterangepicker').startDate;

    var vizualData = riskology.getResult();

    // Set real date for scale
    var actual_date;

    for (var i = 0; i < vizualData.length; i++) {
        actual_date = moment(startDate).add(vizualData[i][0].toString(), 'days').format('LL');

        vizualData[i][0] = actual_date.toString();
    }

    vizualData.unshift(['', '']);


    var data = new google.visualization.arrayToDataTable(vizualData);

    var width = $(window).width() - $(window).width() * 0.07;
    if(width > 700) {
        width = 700;
    }

    var options = {
        width: width,
        legend: {position: 'none'},
        bar: {groupWidth: "100%"}
    };

    var chart = new google.charts.Bar(document.getElementById('chart_div'));
    chart.draw(data, google.charts.Bar.convertOptions(options));
};