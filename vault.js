function find() {
    client = new RiakClient();
    client.bucket('passwords', function(b){get_object(b);});
}

function save(){
    client = new RiakClient();
    client.bucket('passwords', function(b){get_or_new_object(b);});
    $('#errors').text('Password stored');
}

function get_or_new_object(bucket){
    bucket.get_or_new($('input#key').val(), function(status, o){save_object(o);});
}

function save_object(object){
    encrypted = GibberishAES.enc($('input#value').val(), $('input#secret').val());
    object.body = encrypted;
    object.contentType = 'text/plain';
    object.store();
    $('input#value').val(encrypted);
}

function get_object(bucket){
    bucket.get($('input#key').val(), function(s,o){get_value(o);});
}

function get_value(object){
    try {
        decrypted = GibberishAES.dec(object.body, $('input#secret').val());
        $('input#value').val(decrypted);
        $('#errors').text("");
    }
    catch(e) {
        $('#errors').text("Error decrypting, passphrase may be incorrect");
        $('input#value').val("");
    }
}

//---------------------BEGIN NEW STUFF
function fetch(key){
    client = new RiakClient();
    client.bucket('passwords', function(bucket){
        bucket.get(key, function(s,o){
            try {
                decrypted = GibberishAES.dec(o.body, $('input#secret').val());
                $('#errors').text(decrypted);
            }
            catch(e) {
                $('#errors').text("Error decrypting, passphrase may be incorrect");
            }
        });
    });
}

function store(){
    client = new RiakClient();
    client.bucket('passwords', function(bucket){
        bucket.get_or_new($('input#key').val(), function(status, object){
            value = {
                'username':$('input#username').val(),
                'password':$('input#password').val(),
                'notes':$('input#notes').val()
            };
            encrypted = GibberishAES.enc(value, $('input#secret').val());
            object.body = encrypted;
            object.contentType = 'text/plain';
            object.store();
        });
    });
    var template = [
        ['p', 'Account info encrypted and stored'],
        ['p', ['a', {'href':'#/list_keys'}, 'List Accounts']],
        ['p', ['a', {'href':'#/new'}, 'Add another']]
    ];
    $('#content').html(microjungle(template));
}

function list_keys(){
    client = new RiakClient();
    var bucket = new RiakBucket('passwords', client);
    bucket.keys(function(keys){
        var data = {'keys': keys.sort()};
        var template = [['div', {'id':'passphrase'},
                            ['a', {'href':'#/new'}, 'New Account'],
                            ['table',
                                ['tr',
                                    ['td', 'Passphrase:'],
                                    ['td',
                                        ['input', {'type':'password', 'id':'secret'}]]]]],
                        ['div',
                            data.keys.map(function(text){
                                return ['p', ['a', {'href': '#/fetch/'+text}, text]];
                            })
                        ]];
        $('#content').html(microjungle(template));
    });
}

function new_item(){
    var template = [['table',
                        ['tr',
                            ['td', 'Account:'],
                            ['td', ['input', {'type':'text', 'id':'key'}]]],
                        ['tr',
                            ['td', 'Passphrase:'],
                            ['td', ['input', {'type':'password', 'id':'secret'}]]],
                        ['tr',
                            ['td', 'Username:'],
                            ['td', ['input',{'type':'text', 'id':'username'}]]],
                        ['tr',
                            ['td', 'Password:'],
                            ['td', ['input',{'type':'text', 'id':'password'}]]],
                        ['tr',
                            ['td', 'Notes:'],
                            ['td', ['textarea', {'rows':3, 'cols':20, 'id':'notes'}]]],
                        ['tr',
                            ['td', ['input', {'type':'button', 'value':'Store', 'onclick':'store();'}]]],
                        ['tr',
                            ['td', ['a', {'href':'#/list_keys'}, 'Cancel']]]
    ]];
    $('#content').html(microjungle(template));

}

$(function() {
    var routes = {
        '/fetch': {
            '/(\\w+)': {
                on: function(key){fetch(key);}
            }
        },
        '/list_keys':list_keys,
        '/new':new_item
    };
    var router = Router(routes).init();
    window.location = '#/list_keys';
});