import { CommonActions, StackRouter } from '@react-navigation/routers';

/**
 * Bu test bir kutuphane davranisini civiliyor.
 *
 * Kapanis ekrani, adimlarin altinda asili kaliyordu ve kullanici herhangi
 * bir adimda geri kaydirinca oraya dusuyordu. Sebep, bu surumde `navigate`
 * yiginda geriye donmemesi: ayni ada ikinci bir ekran itiyor. Sonraki bir
 * surumde davranis degisirse veya birisi `popTo`yu `navigate`e cevirirse,
 * kirilan sey burada gorunsun.
 */

const options = {
  routeNames: ['Steps', 'Completion'],
  routeParamList: {},
  routeGetIdList: {},
};

const router = StackRouter({});

type Action = Parameters<typeof router.getStateForAction>[1];
type State = ReturnType<typeof router.getRehydratedState>;

/** Bir eylemi uygular ve sonucu yine tam bir duruma cevirir. */
function advance(state: State, action: Action): State {
  const next = router.getStateForAction(state, action, options);
  if (next === null) throw new Error('eylem uygulanamadi');
  return router.getRehydratedState(next, options);
}

function names(state: State) {
  return state.routes.map((route) => route.name);
}

/**
 * `StackActions.popTo` eylemi elle kuruluyor: yardimcinin tipi `params`
 * alanini "verilmis ama undefined" olarak birakiyor ve bu ayar altinda
 * yonlendiricinin eylem tipine uymuyor. Uretilen eylem `navigation.popTo`
 * cagrisinin urettiginin aynisi.
 */
function popTo(name: string): Action {
  return { type: 'POP_TO', payload: { name } };
}

/** Akis bitirilmis, kapanis ekrani acilmis bir yigin. */
function stackWithCompletion(): State {
  const initial = router.getRehydratedState(router.getInitialState(options), options);
  return advance(initial, CommonActions.navigate('Completion'));
}

describe('adim yigini', () => {
  it('kapanis ekrani akis bitirilerek aciliyor', () => {
    expect(names(stackWithCompletion())).toEqual(['Steps', 'Completion']);
  });

  it('navigate geriye donmuyor, ikinci bir adim ekrani itiyor', () => {
    const pushed = advance(stackWithCompletion(), CommonActions.navigate('Steps'));
    expect(names(pushed)).toEqual(['Steps', 'Completion', 'Steps']);
  });

  it('popTo kapanis ekranini yigindan dusuruyor', () => {
    const popped = advance(stackWithCompletion(), popTo('Steps'));
    expect(names(popped)).toEqual(['Steps']);
  });
});
