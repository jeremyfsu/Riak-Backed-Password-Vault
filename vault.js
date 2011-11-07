function list_keys(){
    client = new RiakClient();
    var bucket = new RiakBucket('passwords', client);
    bucket.keys(function(keys){
        var data = {'keys': keys.sort()};
        var template = [['div', {'id':'passphrase'},
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
                                return ['table',
                                    ['tr',
                                        ['td', ['a', {'href': '#/fetch/'+text}, unescape(text)]],
                                        ['td', ['a', {'href': '/riak/passwords/'+text, 'class':'delete'}, 'X']]
                                    ]
                                ];
                            })
                        ],
                        ['div', {'class':'new'},
                            ['a', {'href':'#/new'}, 'New Account']
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
                $('#errors').text(e);
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

//This function was borrowed from Rekon https://github.com/basho/rekon
//I thought it was pretty darn slick plus it taught me some JQuery tricks
$('a.delete').live('click', function(e){
    var link = this;
    e.preventDefault();
    if(!confirm("Are you sure you want to delete:\n" + $(link).attr('href'))) { return; }

    $.ajax({
        type: 'DELETE',
        url: $(link).attr('href')
    }).success(function(){
        $(link).closest('tr').remove();
    }).error(function(){
        alert('There was an error deleting this object from Riak.');
    });
});

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