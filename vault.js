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
                                        ['input', {'type':'password', 'id':'secret'}]
                                    ]
                                ]
                            ]
                        ],
                        ['div',
                            data.keys.map(function(text){
                                return ['p', ['a', {'href': '#/fetch/'+text}, text]];
                            })
                        ]
        ];
        $('#content').html(microjungle(template));
    });
}

function fetch(key){
    client = new RiakClient();
    client.bucket('passwords', function(bucket){
        bucket.get(key, function(s,o){
            try {
                decrypted = GibberishAES.dec(o.body, $('input#secret').val());
                record = JSON.parse(decrypted);
                var template = [[
                    ['table',
                        ['tr',
                            ['td', 'Account:'],
                            ['td', key]
                        ],
                        ['tr',
                            ['td', 'Username:'],
                            ['td', record.username]
                        ],
                        ['tr',
                            ['td', 'Password:'],
                            ['td', record.password]
                        ],
                        ['tr',
                            ['td', 'Notes:'],
                            ['td', record.notes]
                        ]
                    ],
                    ['a', {'href':'#/list_keys'}, 'List Records']
                ]];
                $('#content').html(microjungle(template));
            }
            catch(e) {
                $('#errors').text("Error decrypting, passphrase may be incorrect");
            }
        });
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

function store(){
    client = new RiakClient();
    client.bucket('passwords', function(bucket){
        bucket.get_or_new($('input#key').val(), function(status, object){
            record = {
                'username':$('input#username').val(),
                'password':$('input#password').val(),
                'notes':$('textarea#notes').val()
            };
            encrypted = GibberishAES.enc(JSON.stringify(record), $('input#secret').val());
            object.body = encrypted;
            object.contentType = 'text/plain';
            object.store();
            $('#errors').text('Account info encrypted and stored ');
        });
    });

    window.location = '#/list_keys';
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