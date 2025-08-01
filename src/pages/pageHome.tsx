import { useState, useEffect } from 'react';

// import type { tab } from "../components/tab"
// import type { collection } from "../components/collection"

import { Tabs } from "../components/tabs"
import { CollectionList } from "../components/collectionList"

import { FormAddCollectionItem } from "../components/forms/add-collection"
import { FormDeleteCollection } from "../components/forms/delete-collection";
import { FormAddGroup } from "../components/forms/add-group";

import "../assets/css/components/modal-window.css"

type TGroup = {
	title: string,
	tag: string
}

const HomePage = ()=> {
  const [collections, setСollections] = useState([]);
  const [groups, setGroups] = useState<TGroup[]>([]);
  const [loading, setLoading] = useState(1);
	const [activeCollection, setActiveCollection] = useState<string>('undefined')

	const [formAddItemIsOpen, openFormAddItem] = useState(false)
	const [formAddGroupIsOpen, openFormAddGroup] = useState(false)
	const [formDeleteCollectionIsOpen, openFormDeleteCollection] = useState(false)

	const [deleteColectionId, setDeleteColectionId] = useState('')

	function switchActiveCollection(event: React.MouseEvent<HTMLButtonElement>) {
		if (event.currentTarget.dataset.tab) {
			setActiveCollection(event.currentTarget.dataset.tab)
		}
	}

  useEffect(() => {
    fetch('http://127.0.0.1:3000/groups')
      .then(response => response.json())
      .then(data => {
        setGroups(data);
        setLoading(0);
      })
      .catch(error => {
        console.error('Ошибка:', error);
        setLoading(-1);
      });
  }, []);

  useEffect(() => {
    fetch('http://127.0.0.1:3000/collections')
      .then(response => response.json())
      .then(data => {
        setСollections(data);
        setLoading(0);
      })
      .catch(error => {
        console.error('Ошибка:', error);
        setLoading(-1);
      });
  }, []);

  if (loading === 1) return <p className="loading">Загрузка...</p>;

	switch (loading) {
		case 1:
			return <p className="loading">Загрузка...</p>;
		case -1:
			return <p className="error">Произошла ошибка во время загрузки!</p>;
	}

	function openDeleteModal(event: React.MouseEvent<HTMLButtonElement>){

		const id: string = event.currentTarget.closest('.collection__item')?.getAttribute('id') || ''

		setDeleteColectionId(id)
		openFormDeleteCollection(true)
	}

	return (
		<div className="home">
			<div className="top__buttons">
				<button className="btn-add" onClick={()=> {
					openFormAddItem(true)
				}}>Добавить тайтл</button>
				<button className="btn-add" onClick={()=> {
					openFormAddGroup(true)
				}}>Добавить группу</button>
			</div>

			<Tabs tabs={groups} active={activeCollection} clickHandler={switchActiveCollection}></Tabs>

			{groups.map((group, index) => {
				return <CollectionList key={index} group={group.tag} collections={collections} activeGroup={activeCollection} deleteHandler={openDeleteModal}></CollectionList>
			})}

			<div className={"modal-window" + (formAddItemIsOpen ? " opened" : " closed")}>
				<div className="modal-window__overlay" onClick={()=> { openFormAddItem(false) }}></div>
				<div className="modal-window__wrapper">
					<button className="modal-window__close" onClick={() => { openFormAddItem(false) }}>
						<img src="img/icons/icon-cross.svg" alt="close" />
					</button>
					<div className="modal-window__content">
						<FormAddCollectionItem groups={groups}/>
					</div>
				</div>
			</div>

			<div className={"modal-window" + (formAddGroupIsOpen ? " opened" : " closed")}>
				<div className="modal-window__overlay" onClick={()=> { openFormAddGroup(false) }}></div>
				<div className="modal-window__wrapper">
					<button className="modal-window__close" onClick={() => { openFormAddGroup(false) }}>
						<img src="img/icons/icon-cross.svg" alt="close" />
					</button>
					<div className="modal-window__content">
						<FormAddGroup/>
					</div>
				</div>
			</div>

			<div className={"modal-window" + (formDeleteCollectionIsOpen ? " opened" : " closed")}>
				<div className="modal-window__overlay" onClick={()=> {openFormDeleteCollection(false)}}></div>
				<div className="modal-window__wrapper">
					<button className="modal-window__close" onClick={() => {openFormDeleteCollection(false)}}>
						<img src="img/icons/icon-cross.svg" alt="close" />
					</button>
					<div className="modal-window__content">
						<FormDeleteCollection collectionId={deleteColectionId} />
					</div>
				</div>
			</div>
		</div>
	)
}

export { HomePage }