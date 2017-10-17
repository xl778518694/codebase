var $ = $ || Tools.D;
$('.switch').on('click', function() {
    var elem = $(this);
    if (elem.hasClass('onswitch')) {
        elem.removeClass('onswitch');
    } else {
        elem.addClass('onswitch');
    }
});

$('.select').on('click', function(event) {
    var elem = $(this),
        t = Tools.Events.getTarget(event);
    if ($(t).hasClass('option') || t.tagName.toLowerCase() == 'dd') {
        $('.option', this).removeClass('current');
        $('dd', this).removeClass('current');
        $(t).addClass('current');
        $('input', this).attr('value', $(t).attr('data-value'));
    }
    if (elem.hasClass('selected')) {
        elem.removeClass('selected');
    } else {
        $('.select').removeClass('selected');
        elem.addClass('selected');
    }
    Tools.Events.stopBubble(event);
});

$('.checkbox').on('click', function(e) {
    var elem = $(this),
        f = elem.attr('for'),
        c = elem.hasClass('checked'),
        d = elem.hasClass('disabled');
    if (!d) {
        if (c) {
            elem.removeClass('checked');
            $('#' + f)[0].checked = false;
        } else {
            elem.addClass('checked');
            $('#' + f)[0].checked = true;
        }
    }
});

$('.checkboxs').on('click', function(e) {
    var elem = $(this),
        f = elem.attr('for'),
        a = elem.hasClass('all'),
        d = elem.hasClass('disabled');
    if (!d) {
        elem.removeClass('some');
        if (a) {
            elem.removeClass('all');
        } else {
            elem.addClass('all');
        }
    }
});

$(document).on('click', function(e) {
    $('.select').removeClass('selected');
});
