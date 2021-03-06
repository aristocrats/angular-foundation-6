import angular from "angular";
import mocks from "angular-mocks";

import "src/tabs/tabs.js"
import "src/tabs/tab.html.js"
import "src/tabs/tabset.html.js"

describe('tabs', function() {

    var inject = mocks.inject;
    var module = mocks.module;

    beforeEach(module('mm.foundation.tabs', 'template/tabs/tabset.html', 'template/tabs/tab.html'));

    var elm;
    var scope;

    function titles() {
        return angular.element(elm[0].querySelectorAll('ul.tabs li'));
    }

    function contents() {
        return angular.element(elm[0].querySelectorAll('div.tabs-content div.tabs-panel'));
    }

    function expectTitles(titlesArray) {
        var t = titles();
        expect(t.length).toEqual(titlesArray.length);
        for (var i = 0; i < t.length; i++) {
            expect(t.eq(i).text().trim()).toEqual(titlesArray[i]);
        }
    }

    function expectContents(contentsArray) {
        var c = contents();
        expect(c.length).toEqual(contentsArray.length);
        for (var i = 0; i < c.length; i++) {
            expect(c.eq(i).text().trim()).toEqual(contentsArray[i]);
        }
    }

    describe('basics', function() {

        beforeEach(inject(function($compile, $rootScope) {
            scope = $rootScope.$new();
            scope.first = '1';
            scope.second = '2';
            scope.actives = {};
            scope.selectFirst = jasmine.createSpy();
            scope.selectSecond = jasmine.createSpy();
            elm = $compile([
                '<div>',
                '  <tabset class="hello" data-pizza="pepperoni">',
                '    <tab heading="First Tab {{first}}" active="actives.one" select="selectFirst()">',
                '      first content is {{first}}',
                '    </tab>',
                '    <tab active="actives.two" select="selectSecond()">',
                '      <tab-heading><b>Second</b> Tab {{second}}</tab-heading>',
                '      second content is {{second}}',
                '    </tab>',
                '  </tabset>',
                '</div>'
            ].join('\n'))(scope);
            scope.$apply();
            return elm;
        }));

        it('should pass class and other attributes on to tab template', function() {
            var tabbable = angular.element(elm[0].querySelector('.tabbable'));
            expect(tabbable).toHaveClass('hello');
            expect(tabbable.attr('data-pizza')).toBe('pepperoni');
        });

        it('should create clickable titles', function() {
            var t = titles();
            expect(t.length).toBe(2);
            expect(t.find('a').eq(0).text()).toBe('First Tab 1');
            //It should put the tab-heading element into the 'a' title
            expect(matches(t.find('a')[1].children[0], 'tab-heading')).toBe(true);
            expect(t.find('a').eq(1).children().html()).toBe('<b>Second</b> Tab 2');
        });

        it('should bind tabs content and set first tab active', function() {
            expectContents(['first content is 1', 'second content is 2']);
            expect(titles().eq(0)).toHaveClass('is-active');
            expect(titles().eq(1)).not.toHaveClass('is-active');
            expect(scope.actives.one).toBe(true);
            expect(scope.actives.two).toBe(false);
        });

        it('should change active on click', function() {
            titles()[1].querySelector('a').click();
            expect(contents().eq(1)).toHaveClass('is-active');
            expect(titles().eq(0)).not.toHaveClass('is-active');
            expect(titles().eq(1)).toHaveClass('is-active');
            expect(scope.actives.one).toBe(false);
            expect(scope.actives.two).toBe(true);
        });

        it('should call select callback on select', function() {
            titles()[1].querySelector('a').click();
            expect(scope.selectSecond).toHaveBeenCalled();
            titles()[0].querySelector('a').click();
            expect(scope.selectFirst).toHaveBeenCalled();
        });

    });

    describe('basics with initial active tab', function() {

        beforeEach(inject(function($compile, $rootScope) {
            scope = $rootScope.$new();

            function makeTab(active) {
                return {
                    active: !!active,
                    select: jasmine.createSpy()
                };
            }
            scope.tabs = [
                makeTab(), makeTab(), makeTab(true), makeTab()
            ];
            elm = $compile([
                '<tabset>',
                '  <tab active="tabs[0].active" select="tabs[0].select()">',
                '  </tab>',
                '  <tab active="tabs[1].active" select="tabs[1].select()">',
                '  </tab>',
                '  <tab active="tabs[2].active" select="tabs[2].select()">',
                '  </tab>',
                '  <tab active="tabs[3].active" select="tabs[3].select()">',
                '  </tab>',
                '</tabset>'
            ].join('\n'))(scope);
            scope.$apply();
        }));

        function expectTabActive(activeTab) {
            var _titles = titles();
            angular.forEach(scope.tabs, function(tab, i) {
                if (activeTab === tab) {
                    expect(tab.active).toBe(true);
                    //It should only call select ONCE for each select
                    expect(tab.select).toHaveBeenCalled();
                    expect(_titles.eq(i)).toHaveClass('is-active');
                    expect(contents().eq(i)).toHaveClass('is-active');
                } else {
                    expect(tab.active).toBe(false);
                    expect(_titles.eq(i)).not.toHaveClass('is-active');
                }
            });
        }

        it('should make tab titles and set active tab active', function() {
            expect(titles().length).toBe(scope.tabs.length);
            expectTabActive(scope.tabs[2]);
        });
    });

    describe('ng-repeat', function() {

        beforeEach(inject(function($compile, $rootScope) {
            scope = $rootScope.$new();

            function makeTab(active) {
                return {
                    active: !!active,
                    select: jasmine.createSpy()
                };
            }
            scope.tabs = [
                makeTab(), makeTab(), makeTab(true), makeTab()
            ];
            elm = $compile([
                '<tabset>',
                '  <tab ng-repeat="t in tabs" active="t.active" select="t.select()">',
                '    <tab-heading><b>heading</b> {{index}}</tab-heading>',
                '    content {{$index}}',
                '  </tab>',
                '</tabset>'
            ].join('\n'))(scope);
            scope.$apply();
        }));

        function titles() {
            return angular.element(elm[0].querySelectorAll('ul.tabs li'));
        }

        function contents(selectorSuffix) {
            var selector = 'div.tabs-content div.tabs-panel';
            if (selectorSuffix) {
                selector += selectorSuffix;
            }
            return angular.element(elm[0].querySelectorAll(selector));
        }

        function expectTabActive(activeTab) {
            var _titles = titles();
            angular.forEach(scope.tabs, function(tab, i) {
                if (activeTab === tab) {
                    expect(tab.active).toBe(true);
                    //It should only call select ONCE for each select
                    expect(tab.select).toHaveBeenCalled();
                    expect(_titles.eq(i)).toHaveClass('is-active');
                    expect(contents().eq(i).text().trim()).toBe('content ' + i);
                    expect(contents().eq(i)).toHaveClass('is-active');
                } else {
                    expect(tab.active).toBe(false);
                    expect(_titles.eq(i)).not.toHaveClass('is-active');
                }
            });
        }

        it('should make tab titles and set active tab active', function() {
            expect(titles().length).toBe(scope.tabs.length);
            expectTabActive(scope.tabs[2]);
        });

        it('should switch active when clicking', function() {
            titles()[3].querySelector('a').click();
            expectTabActive(scope.tabs[3]);
        });

        it('should switch active when setting active=true', function() {
            scope.$apply('tabs[2].active = true');
            expectTabActive(scope.tabs[2]);
        });

        it('should deselect all when no tabs are active', function() {
            angular.forEach(scope.tabs, function(t) {
                t.active = false;
            });
            scope.$apply();
            expectTabActive(null);
            expect(contents('.active').length).toBe(0);

            scope.tabs[2].active = true;
            scope.$apply();
            expectTabActive(scope.tabs[2]);
        });
    });

    describe('advanced tab-heading element', function() {
        beforeEach(inject(function($compile, $rootScope, $sce) {
            scope = $rootScope.$new();
            scope.myHtml = $sce.trustAsHtml("<b>hello</b>, there!");
            scope.value = true;
            elm = $compile([
                '<tabset>',
                '  <tab>',
                '    <tab-heading ng-bind-html="myHtml" ng-show="value">',
                '    </tab-heading>',
                '  </tab>',
                '  <tab><data-tab-heading>1</data-tab-heading></tab>',
                '  <tab><div data-tab-heading>2</div></tab>',
                '  <tab><div tab-heading>3</div></tab>',
                '</tabset>'
            ].join('\n'))(scope);
            scope.$apply();
        }));

        function heading() {
            return angular.element(elm[0].querySelectorAll('ul li a')).children();
        }

        it('should create a heading bound to myHtml', function() {
            expect(heading().eq(0).html()).toBe("<b>hello</b>, there!");
        });

        it('should hide and show the heading depending on value', function() {
            expect(heading().eq(0)).not.toBeHidden();
            scope.$apply('value = false');
            expect(heading().eq(0)).toBeHidden();
            scope.$apply('value = true');
            expect(heading().eq(0)).not.toBeHidden();
        });

        it('should have a tab-heading no matter what syntax was used', function() {
            expect(heading().eq(1).text()).toBe('1');
            expect(heading().eq(2).text()).toBe('2');
            expect(heading().eq(3).text()).toBe('3');
        });

    });

    //Tests that http://git.io/lG6I9Q is fixed
    describe('tab ordering', function() {

        beforeEach(inject(function($compile, $rootScope) {
            scope = $rootScope.$new();
            scope.tabs = [{
                title: "Title 1",
                available: true
            }, {
                title: "Title 2",
                available: true
            }, {
                title: "Title 3",
                available: true
            }];
            elm = $compile([
                '<tabset>',
                '  <!-- a comment -->',
                '  <div>div that makes troubles</div>',
                '  <tab heading="first">First Static</tab>',
                '  <div>another div that may do evil</div>',
                '  <tab ng-repeat="tab in tabs | filter:tabIsAvailable" active="tab.active" heading="{{tab.title}}">some content</tab>',
                '  <!-- another comment -->',
                '  <tab heading="mid">Mid Static</tab>',
                '  a text node',
                '  <!-- another comment -->',
                '  <span>yet another span that may do evil</span>',
                '  <tab ng-repeat="tab in tabs | filter:tabIsAvailable" active="tab.active" heading="Second {{tab.title}}">some content</tab>',
                '  a text node',
                '  <span>yet another span that may do evil</span>',
                '  <!-- another comment -->',
                '  <tab heading="last">Last Static</tab>',
                '  a text node',
                '  <span>yet another span that may do evil</span>',
                '  <!-- another comment -->',
                '</tabset>'
            ].join('\n'))(scope);

            scope.tabIsAvailable = function(tab) {
                return tab.available;
            };
        }));

        it('should preserve correct ordering', function() {
            function titles() {
                return angular.element(elm[0].querySelectorAll('ul.tabs li a'));
            }
            scope.$apply();
            expect(titles().length).toBe(9);
            scope.$apply('tabs[1].available=false');
            scope.$digest();
            expect(titles().length).toBe(7);
            scope.$apply('tabs[0].available=false');
            scope.$digest();
            expect(titles().length).toBe(5);
            scope.$apply('tabs[2].available=false');
            scope.$digest();
            expect(titles().length).toBe(3);
            scope.$apply('tabs[0].available=true');
            scope.$digest();
            expect(titles().length).toBe(5);
            scope.$apply('tabs[1].available=true');
            scope.$apply('tabs[2].available=true');
            scope.$digest();
            expect(titles().length).toBe(9);
            expect(titles().eq(0).text().trim()).toBe("first");
            expect(titles().eq(1).text().trim()).toBe("Title 1");
            expect(titles().eq(2).text().trim()).toBe("Title 2");
            expect(titles().eq(3).text().trim()).toBe("Title 3");
            expect(titles().eq(4).text().trim()).toBe("mid");
            expect(titles().eq(5).text().trim()).toBe("Second Title 1");
            expect(titles().eq(6).text().trim()).toBe("Second Title 2");
            expect(titles().eq(7).text().trim()).toBe("Second Title 3");
            expect(titles().eq(8).text().trim()).toBe("last");
        });
    });

    describe('tabset controller', function() {
        function mockTab(isActive) {
            return {
                active: !!isActive
            };
        }

        var ctrl;
        beforeEach(inject(function($controller, $rootScope) {
            scope = $rootScope;
            //instantiate the controller stand-alone, without the directive
            ctrl = $controller('TabsetController', {
                $scope: scope,
                $element: null
            });
        }));


        describe('select', function() {

            it('should mark given tab selected', function() {
                var tab = mockTab();

                ctrl.select(tab);
                expect(tab.active).toBe(true);
            });


            it('should deselect other tabs', function() {
                var tab1 = mockTab(),
                    tab2 = mockTab(),
                    tab3 = mockTab();

                ctrl.addTab(tab1);
                ctrl.addTab(tab2);
                ctrl.addTab(tab3);

                ctrl.select(tab1);
                expect(tab1.active).toBe(true);
                expect(tab2.active).toBe(false);
                expect(tab3.active).toBe(false);

                ctrl.select(tab2);
                expect(tab1.active).toBe(false);
                expect(tab2.active).toBe(true);
                expect(tab3.active).toBe(false);

                ctrl.select(tab3);
                expect(tab1.active).toBe(false);
                expect(tab2.active).toBe(false);
                expect(tab3.active).toBe(true);
            });
        });


        describe('addTab', function() {

            it('should append tab', function() {
                var tab1 = mockTab(),
                    tab2 = mockTab();

                expect(ctrl.tabs).toEqual([]);

                ctrl.addTab(tab1);
                expect(ctrl.tabs).toEqual([tab1]);

                ctrl.addTab(tab2);
                expect(ctrl.tabs).toEqual([tab1, tab2]);
            });


            it('should select the first one', function() {
                var tab1 = mockTab(),
                    tab2 = mockTab();

                ctrl.addTab(tab1);
                expect(tab1.active).toBe(true);

                ctrl.addTab(tab2);
                expect(tab1.active).toBe(true);
            });

            it('should not select the first tab if $scope.openOnLoad of the controller is false', function() {
                scope.openOnLoad = false;
                var tab = mockTab();
                ctrl.addTab(tab);
                expect(tab.active).toBe(false);
            });

            it('should select a tab added that\'s already active', function() {
                var tab1 = mockTab(),
                    tab2 = mockTab(true);
                ctrl.addTab(tab1);
                expect(tab1.active).toBe(true);

                ctrl.addTab(tab2);
                expect(tab1.active).toBe(false);
                expect(tab2.active).toBe(true);
            });
        });
    });

    describe('remove', function() {

        it('should remove title tabs when elements are destroyed and change selection', inject(function($controller, $compile, $rootScope) {
            scope = $rootScope.$new();
            elm = $compile("<tabset><tab heading='1'>Hello</tab><tab ng-repeat='i in list' heading='tab {{i}}'>content {{i}}</tab></tabset>")(scope);
            scope.$apply();

            expectTitles(['1']);
            expectContents(['Hello']);

            scope.$apply('list = [1,2,3]');
            expectTitles(['1', 'tab 1', 'tab 2', 'tab 3']);
            expectContents(['Hello', 'content 1', 'content 2', 'content 3']);

            // Select last tab
            titles().find('a')[3].click();
            expect(contents().eq(3)).toHaveClass('is-active');
            expect(titles().eq(3)).toHaveClass('is-active');

            // Remove last tab
            scope.$apply('list = [1,2]');
            expectTitles(['1', 'tab 1', 'tab 2']);
            expectContents(['Hello', 'content 1', 'content 2']);

            // "tab 2" is now selected
            expect(titles().eq(2)).toHaveClass('is-active');
            expect(contents().eq(2)).toHaveClass('is-active');

            // Select 2nd tab ("tab 1")
            titles().find('a')[1].click();
            expect(titles().eq(1)).toHaveClass('is-active');
            expect(contents().eq(1)).toHaveClass('is-active');

            // Remove 2nd tab
            scope.$apply('list = [2]');
            expectTitles(['1', 'tab 2']);
            expectContents(['Hello', 'content 2']);

            // New 2nd tab is now selected
            expect(titles().eq(1)).toHaveClass('is-active');
            expect(contents().eq(1)).toHaveClass('is-active');
        }));
    });

    describe('vertical', function() {
        beforeEach(inject(function($compile, $rootScope) {
            scope = $rootScope.$new();
            scope.vertical = true;
            elm = $compile('<tabset vertical="vertical"></tabset>')(scope);
            scope.$apply();
        }));

        it('to show tabs vertically', function() {
            expect(angular.element(elm[0].querySelectorAll('ul.tabs'))).toHaveClass('vertical');
        });
    });

    describe('open-on-load', function() {
        beforeEach(inject(function($compile, $rootScope) {
            scope = $rootScope.$new();
            $compile('<tabset open-on-load="false"></tabset>')(scope);
            scope.$apply();
        }));

        it('to show tabs vertically', function() {
            expect(scope.openOnLoad).toBeFalsy();
        });
    });

    //https://github.com/angular-ui/bootstrap/issues/524
    describe('child compilation', function() {

        var elm;
        beforeEach(inject(function($compile, $rootScope) {
            elm = $compile('<tabset><tab><div></div></tab></tabset></div>')($rootScope.$new());
            $rootScope.$apply();
        }));

        it('should hookup the tab\'s children to the tab with $compile', function() {
            var tabChild = angular.element(elm[0].querySelector('.tabs-panel :first-child'));
            expect(tabChild.inheritedData('$tabsetController')).toBeTruthy();
        });
    });


    describe('disabled', function() {
        beforeEach(inject(function($compile, $rootScope) {
            scope = $rootScope.$new();
            scope.disabledFlag = true;
            elm = $compile('<tabset><tab></tab><tab disabled="disabledFlag"></tab></tabset>')(scope);
            scope.$apply();
        }));

        it('does not activate on click when disabledFlag is true', function() {
            titles()[1].querySelector('a').click();
            expect(titles().eq(1)).not.toHaveClass('is-active');
            expect(titles().eq(0)).toHaveClass('is-active');
        });

        it('activates on click when disabledFlag is false', function() {
            scope.disabledFlag = false;
            scope.$apply();
            titles()[1].querySelector('a').click();
            expect(titles().eq(1)).toHaveClass('is-active');
            expect(titles().eq(0)).not.toHaveClass('is-active');
        });
    });

    //https://github.com/angular-ui/bootstrap/issues/631
    describe('ng-options in content', function() {
        var elm;
        it('should render correct amount of options', inject(function($compile, $rootScope) {
            var scope = $rootScope.$new();
            elm = $compile('<tabset><tab><select ng-model="foo" ng-options="i for i in [1,2,3]"></tab>')(scope);
            scope.$apply();

            var select = elm.find('select');
            scope.$apply();
            expect(select.children().length).toBe(4);
        }));
    });

    //https://github.com/angular-ui/bootstrap/issues/599
    describe('ng-repeat in content', function() {
        var elm;
        it('should render ng-repeat', inject(function($compile, $rootScope) {
            var scope = $rootScope.$new();
            scope.tabs = [{
                title: 'a',
                array: [1, 2, 3]
            }, {
                title: 'b',
                array: [2, 3, 4]
            }, {
                title: 'c',
                array: [3, 4, 5]
            }];
            elm = $compile('<div><tabset>' +
                '<tab ng-repeat="tab in tabs" heading="{{tab.title}}">' +
                '<tab-heading>{{$index}}</tab-heading>' +
                '<span ng-repeat="a in tab.array">{{a}},</span>' +
                '</tab>' +
                '</tabset></div>')(scope);
            scope.$apply();

            var contents = elm[0].querySelectorAll('.tabs-panel');
            expect(contents[0].textContent.trim()).toEqual('1,2,3,');
            expect(contents[1].textContent.trim()).toEqual('2,3,4,');
            expect(contents[2].textContent.trim()).toEqual('3,4,5,');
        }));
    });

    //https://github.com/angular-ui/bootstrap/issues/783
    describe('nested tabs', function() {
        var elm;
        it('should render without errors', inject(function($compile, $rootScope) {
            var scope = $rootScope.$new();
            elm = $compile([
                '<div>',
                '  <tabset>',
                '    <tab heading="Tab 1">',
                '      <tabset>',
                '        <tab heading="Tab 1A">',
                '        </tab>',
                '      </tabset>',
                '    </tab>',
                '    <tab heading="Tab 2">',
                '      <tabset>',
                '        <tab heading="Tab 2A">',
                '        </tab>',
                '      </tabset>',
                '    </tab>',
                '  </tabset>',
                '</div>'
            ].join('\n'))(scope);
            scope.$apply();

            // 1 outside tabset, 2 nested tabsets
            expect(elm[0].querySelectorAll('.tabbable').length).toEqual(3);
        }));

        it('should render with the correct scopes', inject(function($compile, $rootScope) {
            var scope = $rootScope.$new();
            scope.tab1Text = 'abc';
            scope.tab1aText = '123';
            scope.tab1aHead = '123';
            scope.tab2aaText = '456';
            elm = $compile([
                '<div>',
                '  <tabset>',
                '    <tab heading="Tab 1">',
                '      <tabset>',
                '        <tab heading="{{ tab1aHead }}">',
                '          {{ tab1aText }}',
                '        </tab>',
                '      </tabset>',
                '      <span class="tab-1">{{ tab1Text }}</span>',
                '    </tab>',
                '    <tab heading="Tab 2">',
                '      <tabset>',
                '        <tab heading="Tab 2A">',
                '          <tabset>',
                '            <tab heading="Tab 2AA">',
                '              <span class="tab-2aa">{{ tab2aaText }}</span>',
                '            </tab>',
                '          </tabset>',
                '        </tab>',
                '      </tabset>',
                '    </tab>',
                '  </tabset>',
                '</div>'
            ].join('\n'))(scope);
            scope.$apply();

            var outsideTabset = elm[0].querySelector('.tabbable');
            var nestedTabset = outsideTabset.querySelectorAll('.tabbable');

            expect(elm[0].querySelectorAll('.tabbable').length).toEqual(4);
            expect(outsideTabset.querySelector('.tabs-panel').querySelector('.tab-1').textContent.trim()).toEqual(scope.tab1Text);
            expect(nestedTabset[0].querySelector('.tabs-panel').textContent.trim()).toEqual(scope.tab1aText);
            expect(nestedTabset[0].querySelector('ul.tabs li').textContent.trim()).toEqual(scope.tab1aHead);
            expect(nestedTabset[2].querySelector('.tabs-panel').querySelector('.tab-2aa').textContent.trim()).toEqual(scope.tab2aaText);
        }));

        it('ng-repeat works with nested tabs', inject(function($compile, $rootScope) {
            var scope = $rootScope.$new();
            scope.tabs = [{
                tabs: [{
                    content: 'tab1a'
                }, {
                    content: 'tab2a'
                }],
                content: 'tab1'
            }];
            elm = $compile([
                '<div>',
                '  <tabset>',
                '    <tab ng-repeat="tab in tabs">',
                '      <tabset>',
                '        <tab ng-repeat="innerTab in tab.tabs">',
                '          <span class="inner-tab-content">{{ innerTab.content }}</span>',
                '        </tab>',
                '      </tabset>',
                '      <span class="outer-tab-content">{{ tab.content }}</span>',
                '    </tab>',
                '  </tabset>',
                '</div>'
            ].join('\n'))(scope);
            scope.$apply();

            expect(elm[0].querySelector('.inner-tab-content').textContent.trim()).toEqual(scope.tabs[0].tabs[0].content);
            expect(elm[0].querySelectorAll('.inner-tab-content')[1].textContent.trim()).toEqual(scope.tabs[0].tabs[1].content);
            expect(elm[0].querySelector('.outer-tab-content').textContent.trim()).toEqual(scope.tabs[0].content);
        }));
    });
});
